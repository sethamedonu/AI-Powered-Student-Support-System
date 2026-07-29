import type { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { createLogger } from '../../shared/utils/logger.js';
import { SQSChatMessageSchema } from '../../core/application/dtos/chat.dto.js';
import { ChatService } from '../../core/application/services/chat.service.js';
import { DynamoConversationRepository } from '../../core/infrastructure/repositories/conversation.repository.js';
import { DynamoMessageRepository } from '../../core/infrastructure/repositories/message.repository.js';
import { DynamoCacheRepository } from '../../core/infrastructure/repositories/cache.repository.js';
import { DynamoKnowledgeRepository } from '../../core/infrastructure/repositories/knowledge.repository.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/analytics.repository.js';
import { BedrockProvider } from '../../core/infrastructure/ai/bedrock.provider.js';
import { AIOrchestrator } from '../../core/infrastructure/ai/orchestrator.js';

const logger = createLogger('process-message');

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

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchResponse['batchItemFailures'] = [];

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body) as Record<string, unknown>;
      const parsed = SQSChatMessageSchema.safeParse(body);

      if (!parsed.success) {
        logger.warn('Invalid SQS message schema', { messageId: record.messageId, errors: parsed.error.flatten() });
        batchItemFailures.push({ itemIdentifier: record.messageId });
        continue;
      }

      const { userId, question, category, conversationId } = parsed.data;

      await chatService.sendMessage(userId, {
        conversationId,
        message: question,
        category: category as never,
      });

      logger.info('SQS message processed', { messageId: record.messageId, userId });
    } catch (error) {
      logger.error('Failed to process SQS message', { messageId: record.messageId, error });
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
