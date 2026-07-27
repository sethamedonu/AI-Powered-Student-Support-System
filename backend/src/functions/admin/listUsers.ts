import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoUserRepository } from '../../core/infrastructure/repositories/UserRepository.js';

const repo = new DynamoUserRepository();

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const limit = Math.min(Number(event.queryStringParameters?.['limit'] ?? 20), 100);
    const result = await repo.list({ limit });
    return successResponse(result, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
