import type { IConversationRepository, IMessageRepository } from '../../domain/repositories/index.js';
import type { AIOrchestrator } from '../../infrastructure/ai/orchestrator.js';
import type { SendMessageInput, SendMessageResponse } from '../dtos/chat.dto.js';
import { generateId, nowIso } from '../../../shared/utils/helpers.js';
import { createLogger } from '../../../shared/utils/logger.js';

const logger = createLogger('chat-service');

export class ChatService {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly messageRepo: IMessageRepository,
    private readonly orchestrator: AIOrchestrator,
  ) {}

  async sendMessage(
    userId: string,
    input: SendMessageInput,
  ): Promise<SendMessageResponse> {
    // Resolve or create conversation
    let conversationId = input.conversationId;
    if (!conversationId) {
      conversationId = generateId();
      await this.conversationRepo.create({
        userId,
        conversationId,
        title: input.message.slice(0, 60),
      });
      logger.info('New conversation created', { conversationId });
    } else {
      const existing = await this.conversationRepo.findById(userId, conversationId);
      if (!existing) {
        await this.conversationRepo.create({
          userId,
          conversationId,
          title: input.message.slice(0, 60),
        });
      }
    }

    // Persist user message
    const userMessageId = generateId();
    await this.messageRepo.create({
      conversationId,
      messageId: userMessageId,
      role: 'user',
      content: input.message,
    });

    // Fetch recent history for context (last 6 messages = 3 turns)
    const history = await this.messageRepo.listByConversation(conversationId, { limit: 6 });
    
    // Build conversation history, ensuring it starts with a user message
    let conversationHistory = history.items
      .filter(m => m.messageId !== userMessageId)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    
    // Bedrock requires the first message to be from 'user'
    // If history starts with 'assistant', remove messages until we find a 'user' message
    while (conversationHistory.length > 0 && conversationHistory[0]?.role !== 'user') {
      conversationHistory.shift();
    }
    
    logger.debug('Conversation history prepared', { 
      historyLength: conversationHistory.length,
      firstRole: conversationHistory[0]?.role ?? 'none'
    });

    // Process through AI orchestrator
    const result = await this.orchestrator.process({
      question: input.message,
      conversationHistory,
      category: input.category,
      userId,
    });

    // Persist assistant message
    const assistantMessageId = generateId();
    await this.messageRepo.create({
      conversationId,
      messageId: assistantMessageId,
      role: 'assistant',
      content: result.answer,
      model: result.model,
      cacheStatus: result.cacheStatus,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
    });

    // Update conversation metadata
    await this.conversationRepo.update(userId, conversationId, {
      lastMessageAt: nowIso(),
      messageCount: history.count + 2,
      updatedAt: nowIso(),
    });

    return {
      conversationId,
      messageId: assistantMessageId,
      answer: result.answer,
      model: result.model,
      cacheStatus: result.cacheStatus,
      tokensUsed: result.tokensUsed,
      latencyMs: result.latencyMs,
    };
  }
}
