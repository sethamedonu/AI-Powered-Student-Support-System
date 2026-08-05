import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody, validatePathParams } from '../../shared/utils/validation.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { DynamoUserRepository } from '../../core/infrastructure/repositories/UserRepository.js';
import { env } from '../../shared/types/env.js';
import { createLogger } from '../../shared/utils/logger.js';

const repo = new DynamoUserRepository();
const cognito = new CognitoIdentityProviderClient({ region: env.AWS_REGION });
const logger = createLogger('updateUser');

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

    // Sync Cognito group membership whenever the role changes
    if (updates.role && updates.role !== existing.role) {
      const username = existing.email;
      const addGroup    = updates.role === 'admin' ? 'Administrators' : 'Students';
      const removeGroup = updates.role === 'admin' ? 'Students'       : 'Administrators';

      try {
        await cognito.send(new AdminAddUserToGroupCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID,
          Username: username,
          GroupName: addGroup,
        }));
        logger.info('Added user to Cognito group', { userId, group: addGroup });
      } catch (err) {
        logger.warn('Failed to add user to Cognito group', { userId, group: addGroup, error: String(err) });
      }

      try {
        await cognito.send(new AdminRemoveUserFromGroupCommand({
          UserPoolId: env.COGNITO_USER_POOL_ID,
          Username: username,
          GroupName: removeGroup,
        }));
        logger.info('Removed user from Cognito group', { userId, group: removeGroup });
      } catch (err) {
        // Non-fatal — user may not have been in the group
        logger.warn('Failed to remove user from Cognito group', { userId, group: removeGroup, error: String(err) });
      }
    }

    const updated = await repo.update(userId, updates);
    return successResponse(updated, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
