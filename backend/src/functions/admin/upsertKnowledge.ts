import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody } from '../../shared/utils/validation.js';
import { generateId } from '../../shared/utils/helpers.js';
import { DynamoKnowledgeRepository } from '../../core/infrastructure/repositories/index.js';

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
    const entry = await repo.upsert({
      ...input,
      knowledgeId: input.knowledgeId ?? generateId(),
      isActive: input.isActive ?? true,
    });
    return successResponse(entry, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
