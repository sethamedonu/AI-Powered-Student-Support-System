import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { validateBody } from '../../shared/utils/validation.js';
import { successResponse } from '../../shared/utils/response.js';
import { generateId } from '../../shared/utils/helpers.js';
import { DynamoFeedbackRepository } from '../../core/infrastructure/repositories/index.js';

const FeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.string().min(1),
  comment: z.string().min(10).max(2000).trim(),
  conversationId: z.string().uuid().optional(),
  messageId: z.string().uuid().optional(),
});

const repo = new DynamoFeedbackRepository();

export const handler = createHandler(
  async ({ event, auth, requestId }): Promise<APIGatewayProxyResult> => {
    const input = validateBody(FeedbackSchema, event.body);
    const feedbackId = generateId();

    await repo.create({
      feedbackId,
      userId: auth!.userId,
      conversationId: input.conversationId ?? '',
      messageId: input.messageId ?? '',
      rating: input.rating as 1 | 2 | 3 | 4 | 5,
      comment: input.comment,
    });

    return successResponse({ feedbackId }, 201, requestId);
  },
  { requireAuth: true },
);
