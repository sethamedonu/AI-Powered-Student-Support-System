import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody } from '../../shared/utils/validation.js';
import { generateId } from '../../shared/utils/helpers.js';
import { createLogger } from '../../shared/utils/logger.js';
import { DynamoKnowledgeRepository } from '../../core/infrastructure/repositories/index.js';
import { env } from '../../shared/types/env.js';

const logger = createLogger('upsert-knowledge');
const repo = new DynamoKnowledgeRepository();

const KnowledgeSchema = z.object({
  knowledgeId: z.string().uuid().optional(),
  category: z.enum([
    'admissions', 'registration', 'tuition', 'examinations',
    'calendar', 'graduation', 'scholarships', 'campus-services', 'general',
  ]),
  title: z.string().min(1).max(200),
  content: z.string().min(10).max(5000),
  keywords: z.array(z.string()).min(1).max(20),
  isActive: z.boolean().default(true),
});

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const input = validateBody(KnowledgeSchema, event.body);

    // 1. Save / update the entry in DynamoDB (preserves structured metadata)
    const entry = await repo.upsert({
      ...input,
      knowledgeId: input.knowledgeId ?? generateId(),
      isActive: input.isActive ?? true,
    });

    // 2. Trigger Bedrock Knowledge Base ingestion sync
    //    This re-indexes the S3 data source so the new/updated entry
    //    is reflected in the vector store within ~1–2 minutes.
    if (env.BEDROCK_KNOWLEDGE_BASE_ID && env.BEDROCK_KNOWLEDGE_DATA_SOURCE_ID) {
      try {
        const { BedrockAgentClient, StartIngestionJobCommand } = await import('@aws-sdk/client-bedrock-agent');
        const agentClient = new BedrockAgentClient({ region: env.BEDROCK_REGION });

        await agentClient.send(new StartIngestionJobCommand({
          knowledgeBaseId: env.BEDROCK_KNOWLEDGE_BASE_ID,
          dataSourceId: env.BEDROCK_KNOWLEDGE_DATA_SOURCE_ID,
        }));

        logger.info('Bedrock KB ingestion job started', {
          knowledgeBaseId: env.BEDROCK_KNOWLEDGE_BASE_ID,
          dataSourceId: env.BEDROCK_KNOWLEDGE_DATA_SOURCE_ID,
        });
      } catch (error) {
        // Non-fatal: the entry is saved in DynamoDB; ingestion will retry
        // on the next upsert or can be triggered manually in the console.
        logger.warn('Failed to start Bedrock KB ingestion job', { error: String(error) });
      }
    }

    return successResponse(entry, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
