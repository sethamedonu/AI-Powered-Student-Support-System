import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody } from '../../shared/utils/validation.js';
import { z } from 'zod';
import { DynamoFeedbackRepository } from '../../core/infrastructure/repositories/index.js';
import { generateId } from '../../shared/utils/helpers.js';

const repo = new DynamoFeedbackRepository();

const Schema = z.object({
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  category: z.string().min(1).optional(),
  comment: z.string().min(10).max(500).optional(),
});

export const handler = createHandler(
  async ({ event, auth, requestId }): Promise<APIGatewayProxyResult> => {
    const input = validateBody(Schema, event.body);
    const feedbackId = generateId();
    await repo.create({
      feedbackId,
      userId: auth!.userId,
      ...input,
    });
    return successResponse({ feedbackId }, 201, requestId);
  },
  { requireAuth: true },
);
