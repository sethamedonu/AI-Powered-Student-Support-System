import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { validateBody } from '../../shared/utils/validation.js';
import { successResponse } from '../../shared/utils/response.js';
import { SendMessageSchema } from '../../core/application/dtos/chat.dto.js';
import { ChatService } from '../../core/application/services/chat.service.js';
import { DynamoConversationRepository } from '../../core/infrastructure/repositories/conversation.repository.js';
import { DynamoMessageRepository } from '../../core/infrastructure/repositories/message.repository.js';
import { DynamoCacheRepository } from '../../core/infrastructure/repositories/cache.repository.js';
import { DynamoKnowledgeRepository } from '../../core/infrastructure/repositories/knowledge.repository.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/analytics.repository.js';
import { BedrockProvider } from '../../core/infrastructure/ai/bedrock.provider.js';
import { AIOrchestrator } from '../../core/infrastructure/ai/orchestrator.js';

const chatService = new ChatService(
  new DynamoConversationRepository(),
  new DynamoMessageRepository(),
  new AIOrchestrator(
    new BedrockProvider(),
    new DynamoCacheRepository(),
    new DynamoKnowledgeRepository(),
    new DynamoAnalyticsRepository(),
  ),
);

export const handler = createHandler(
  async ({ event, auth, requestId }): Promise<APIGatewayProxyResult> => {
    const input = validateBody(SendMessageSchema, event.body);
    const result = await chatService.sendMessage(auth!.userId, input);
    return successResponse(result, 200, requestId);
  },
  { requireAuth: true },
);
