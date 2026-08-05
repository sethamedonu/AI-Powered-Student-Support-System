/**
 * admin/syncKnowledge.ts
 *
 * Manually triggers a Bedrock Knowledge Base ingestion job.
 * Call this after uploading one or more documents to S3 to ensure
 * the KB index is up to date.
 *
 * Ingestion typically completes in 1–5 minutes depending on document size.
 */

import type { APIGatewayProxyResult } from 'aws-lambda';
import {
  BedrockAgentClient,
  StartIngestionJobCommand,
  GetIngestionJobCommand,
} from '@aws-sdk/client-bedrock-agent';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { createLogger } from '../../shared/utils/logger.js';
import { env } from '../../shared/types/env.js';

const logger = createLogger('sync-knowledge');

export const handler = createHandler(
  async ({ requestId }): Promise<APIGatewayProxyResult> => {
    if (!env.BEDROCK_KNOWLEDGE_BASE_ID || !env.BEDROCK_KNOWLEDGE_DATA_SOURCE_ID) {
      throw new Error('Bedrock Knowledge Base is not configured');
    }

    const client = new BedrockAgentClient({ region: env.BEDROCK_REGION });

    const response = await client.send(new StartIngestionJobCommand({
      knowledgeBaseId: env.BEDROCK_KNOWLEDGE_BASE_ID,
      dataSourceId: env.BEDROCK_KNOWLEDGE_DATA_SOURCE_ID,
    }));

    const jobId = response.ingestionJob?.ingestionJobId;

    logger.info('Ingestion job started', {
      jobId,
      knowledgeBaseId: env.BEDROCK_KNOWLEDGE_BASE_ID,
    });

    return successResponse(
      {
        jobId,
        status: response.ingestionJob?.status,
        message: 'Knowledge base ingestion started. Documents will be searchable within 1–5 minutes.',
      },
      202,
      requestId,
    );
  },
  { requireAuth: true, requireAdmin: true },
);
