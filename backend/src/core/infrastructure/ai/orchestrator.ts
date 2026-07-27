import type { IAIProvider, AIMessage } from '../ai/provider.interface.js';
import type { ICacheRepository, IKnowledgeRepository, IAnalyticsRepository } from '../../domain/repositories/index.js';
import { createLogger } from '../../../shared/utils/logger.js';
import { generateCacheKey, ttlDays, nowIso } from '../../../shared/utils/helpers.js';
import { generateId } from '../../../shared/utils/helpers.js';
import type { KnowledgeCategory, RequestComplexity } from '../../../shared/types/index.js';

const logger = createLogger('ai-orchestrator');

export interface OrchestratorRequest {
  question: string;
  conversationHistory: AIMessage[];
  category?: KnowledgeCategory;
  complexity?: RequestComplexity;
  userId: string;
}

export interface OrchestratorResponse {
  answer: string;
  model: string;
  cacheStatus: 'hit' | 'miss';
  tokensUsed: number;
  latencyMs: number;
  category?: KnowledgeCategory;
}

export class AIOrchestrator {
  constructor(
    private readonly aiProvider: IAIProvider,
    private readonly cacheRepo: ICacheRepository,
    private readonly knowledgeRepo: IKnowledgeRepository,
    private readonly analyticsRepo: IAnalyticsRepository,
  ) {}

  async process(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const start = Date.now();
    const cacheKey = generateCacheKey(request.question);

    // Layer 1: DynamoDB cache lookup
    const cached = await this.cacheRepo.get(cacheKey);
    if (cached) {
      logger.info('Cache hit', { cacheKey });
      await this.cacheRepo.incrementHitCount(cacheKey);
      await this.recordAnalytics('cache_hit', request.userId);
      return {
        answer: cached.answer,
        model: cached.model,
        cacheStatus: 'hit',
        tokensUsed: 0,
        latencyMs: Date.now() - start,
        category: cached.category,
      };
    }

    // Layer 2: Knowledge base search
    const knowledgeResults = await this.knowledgeRepo.search(request.question);
    let systemPrompt: string | undefined;
    if (knowledgeResults.length > 0) {
      const context = knowledgeResults
        .slice(0, 3)
        .map(k => `[${k.category.toUpperCase()}] ${k.title}:\n${k.content}`)
        .join('\n\n');
      systemPrompt = `You are a helpful student support assistant. Use the following institutional knowledge to answer the student's question accurately:\n\n${context}\n\nIf the answer is not in the provided context, say so clearly.`;
      logger.info('Knowledge base context found', { count: knowledgeResults.length });
    }

    // Layer 3: Invoke AI provider
    const complexity = request.complexity ?? this.detectComplexity(request.question);
    const messages: AIMessage[] = [
      ...request.conversationHistory.slice(-6), // last 3 turns for context
      { role: 'user', content: request.question },
    ];

    const aiResponse = await this.aiProvider.generate({
      messages,
      systemPrompt,
      complexity,
      category: request.category,
    });

    if (aiResponse.guardrailAction === 'BLOCKED') {
      logger.warn('Guardrail blocked response', { userId: request.userId });
      return {
        answer: "I'm sorry, I can't respond to that request. Please ask about admissions, courses, tuition, or other academic topics.",
        model: aiResponse.model,
        cacheStatus: 'miss',
        tokensUsed: 0,
        latencyMs: Date.now() - start,
      };
    }

    // Layer 4: Cache the new response
    const category = request.category ?? knowledgeResults[0]?.category ?? 'general';
    await this.cacheRepo.set({
      cacheKey,
      question: request.question,
      answer: aiResponse.content,
      category,
      model: aiResponse.model,
      expiresAt: ttlDays(30),
    });

    await this.recordAnalytics('ai_invocation', request.userId, {
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      complexity,
    });

    return {
      answer: aiResponse.content,
      model: aiResponse.model,
      cacheStatus: 'miss',
      tokensUsed: aiResponse.tokensUsed,
      latencyMs: Date.now() - start,
      category,
    };
  }

  private detectComplexity(question: string): RequestComplexity {
    const complexKeywords = [
      'explain', 'compare', 'difference', 'why', 'how does', 'calculate',
      'requirements', 'process', 'steps', 'policy', 'appeal', 'exception',
    ];
    const lower = question.toLowerCase();
    return complexKeywords.some(k => lower.includes(k)) ? 'complex' : 'simple';
  }

  private async recordAnalytics(
    metricType: string,
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.analyticsRepo.record({
        metricType,
        value: 1,
        metadata: { userId, ...metadata },
      });
    } catch {
      // analytics failures must never break the main flow
    }
  }
}
