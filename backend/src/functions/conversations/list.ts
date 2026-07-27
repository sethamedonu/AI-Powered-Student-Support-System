import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoConversationRepository } from '../../core/infrastructure/repositories/conversation.repository.js';

const repo = new DynamoConversationRepository();

export const handler = createHandler(
  async ({ event, auth, requestId }): Promise<APIGatewayProxyResult> => {
    const limit = Math.min(Number(event.queryStringParameters?.['limit'] ?? 20), 50);
    const result = await repo.listByUser(auth!.userId, { limit });
    return successResponse(result, 200, requestId);
  },
  { requireAuth: true },
);
