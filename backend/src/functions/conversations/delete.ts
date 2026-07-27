import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { DynamoConversationRepository } from '../../core/infrastructure/repositories/conversation.repository.js';
import { DynamoMessageRepository } from '../../core/infrastructure/repositories/message.repository.js';

const conversationRepo = new DynamoConversationRepository();
const messageRepo = new DynamoMessageRepository();

export const handler = createHandler(
  async ({ event, auth, requestId }): Promise<APIGatewayProxyResult> => {
    const conversationId = event.pathParameters?.['conversationId'];
    if (!conversationId) throw new NotFoundError('Conversation');

    const conversation = await conversationRepo.findById(auth!.userId, conversationId);
    if (!conversation) throw new NotFoundError('Conversation');

    await Promise.all([
      conversationRepo.delete(auth!.userId, conversationId),
      messageRepo.deleteByConversation(conversationId),
    ]);

    return successResponse({ deleted: true, conversationId }, 200, requestId);
  },
  { requireAuth: true },
);
