import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody, validatePathParams } from '../../shared/utils/validation.js';
import { NotFoundError, ValidationError } from '../../shared/errors/index.js';
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

    logger.info('Update user request received', { userId, updates });

    const existing = await repo.findById(userId);
    if (!existing) {
      logger.warn('User not found', { userId });
      throw new NotFoundError('User');
    }

    logger.info('Existing user found', {
      userId: existing.userId,
      email: existing.email,
      currentRole: existing.role,
    });

    // Sync Cognito group membership whenever the role changes
    if (updates.role && updates.role !== existing.role) {
      const username = existing.email; // Cognito uses email as username
      const newGroup = updates.role === 'admin' ? 'Administrators' : 'Students';
      const oldGroup = existing.role === 'admin' ? 'Administrators' : 'Students';

      logger.info('Role change detected', {
        userId,
        username,
        oldRole: existing.role,
        newRole: updates.role,
        oldGroup,
        newGroup,
      });

      // First, verify the user exists in Cognito
      try {
        const getUserResult = await cognito.send(
          new AdminGetUserCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID,
            Username: username,
          }),
        );
        logger.info('Cognito user verified', {
          userId,
          username,
          cognitoStatus: getUserResult.UserStatus,
        });
      } catch (err) {
        logger.error('Failed to verify Cognito user', {
          userId,
          username,
          error: String(err),
        });
        throw new ValidationError(
          `Cannot update role: User ${username} not found in Cognito`,
        );
      }

      // Add user to new group
      try {
        await cognito.send(
          new AdminAddUserToGroupCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID,
            Username: username,
            GroupName: newGroup,
          }),
        );
        logger.info('Added user to Cognito group', {
          userId,
          username,
          group: newGroup,
        });
      } catch (err) {
        logger.error('Failed to add user to Cognito group', {
          userId,
          username,
          group: newGroup,
          error: String(err),
        });
        // Don't throw - this might fail if user is already in the group
      }

      // Remove user from old group
      try {
        await cognito.send(
          new AdminRemoveUserFromGroupCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID,
            Username: username,
            GroupName: oldGroup,
          }),
        );
        logger.info('Removed user from Cognito group', {
          userId,
          username,
          group: oldGroup,
        });
      } catch (err) {
        logger.warn('Failed to remove user from Cognito group', {
          userId,
          username,
          group: oldGroup,
          error: String(err),
        });
        // Non-fatal — user may not have been in the group
      }
    }

    // Update DynamoDB
    const updated = await repo.update(userId, updates);
    logger.info('User updated successfully in DynamoDB', {
      userId: updated.userId,
      newRole: updated.role,
      updatedAt: updated.updatedAt,
    });

    return successResponse(updated, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
