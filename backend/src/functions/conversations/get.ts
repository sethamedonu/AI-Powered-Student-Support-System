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

    const limit = Math.min(Number(event.queryStringParameters?.['limit'] ?? 50), 100);
    const messages = await messageRepo.listByConversation(conversationId, { limit });

    return successResponse({ conversation, messages }, 200, requestId);
  },
  { requireAuth: true },
);
