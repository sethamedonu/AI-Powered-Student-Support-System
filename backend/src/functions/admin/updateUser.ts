import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody, validatePathParams } from '../../shared/utils/validation.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { DynamoUserRepository } from '../../core/infrastructure/repositories/UserRepository.js';

const repo = new DynamoUserRepository();

const PathSchema = z.object({ userId: z.string().min(1) });

const UpdateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['student', 'admin']).optional(),
  givenName: z.string().min(1).optional(),
  familyName: z.string().min(1).optional(),
});

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const { userId } = validatePathParams(PathSchema, event.pathParameters);
    const updates = validateBody(UpdateSchema, event.body);

    const existing = await repo.findById(userId);
    if (!existing) throw new NotFoundError('User');

    const updated = await repo.update(userId, updates);
    return successResponse(updated, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
