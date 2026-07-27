import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIOrchestrator } from '../../src/core/infrastructure/ai/orchestrator.js';
import type { IAIProvider } from '../../src/core/infrastructure/ai/provider.interface.js';
import type { ICacheRepository, IKnowledgeRepository, IAnalyticsRepository } from '../../src/core/domain/repositories/index.js';

const mockProvider: IAIProvider = {
  name: 'mock',
  generate: vi.fn(),
  isAvailable: vi.fn().mockResolvedValue(true),
};

const mockCache: ICacheRepository = {
  get: vi.fn(),
  set: vi.fn(),
  incrementHitCount: vi.fn(),
  delete: vi.fn(),
};

const mockKnowledge: IKnowledgeRepository = {
  findById: vi.fn(),
  listByCategory: vi.fn(),
  search: vi.fn(),
  upsert: vi.fn(),
  delete: vi.fn(),
};

const mockAnalytics: IAnalyticsRepository = {
  record: vi.fn(),
  query: vi.fn(),
};

const baseRequest = {
  question: 'What are the admission requirements?',
  conversationHistory: [],
  userId: 'user-123',
};

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new AIOrchestrator(mockProvider, mockCache, mockKnowledge, mockAnalytics);
  });

  describe('Layer 1 — Cache hit', () => {
    it('returns cached response without calling AI provider', async () => {
      vi.mocked(mockCache.get).mockResolvedValue({
        cacheKey: 'key',
        question: baseRequest.question,
        answer: 'Cached answer',
        category: 'admissions',
        model: 'nova-lite',
        hitCount: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        expiresAt: 9999999999,
      });

      const result = await orchestrator.process(baseRequest);

      expect(result.cacheStatus).toBe('hit');
      expect(result.answer).toBe('Cached answer');
      expect(result.tokensUsed).toBe(0);
      expect(mockProvider.generate).not.toHaveBeenCalled();
      expect(mockCache.incrementHitCount).toHaveBeenCalledOnce();
    });
  });

  describe('Layer 2 — Knowledge base context', () => {
    it('uses knowledge context in system prompt when found', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockKnowledge.search).mockResolvedValue([
        {
          knowledgeId: 'k1',
          category: 'admissions',
          title: 'Admission Requirements',
          content: 'GPA 3.0 required',
          keywords: ['admission', 'gpa'],
          isActive: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ]);
      vi.mocked(mockProvider.generate).mockResolvedValue({
        content: 'AI answer with context',
        model: 'nova-lite',
        tokensUsed: 100,
        latencyMs: 200,
        guardrailAction: 'NONE',
      });

      const result = await orchestrator.process(baseRequest);

      expect(result.cacheStatus).toBe('miss');
      const generateCall = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(generateCall?.systemPrompt).toContain('GPA 3.0 required');
    });
  });

  describe('Layer 3 — Bedrock invocation', () => {
    it('calls AI provider when cache miss and no knowledge', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockKnowledge.search).mockResolvedValue([]);
      vi.mocked(mockProvider.generate).mockResolvedValue({
        content: 'AI generated answer',
        model: 'nova-lite',
        tokensUsed: 150,
        latencyMs: 300,
        guardrailAction: 'NONE',
      });

      const result = await orchestrator.process(baseRequest);

      expect(result.answer).toBe('AI generated answer');
      expect(result.cacheStatus).toBe('miss');
      expect(result.tokensUsed).toBe(150);
      expect(mockCache.set).toHaveBeenCalledOnce();
    });

    it('returns blocked message when guardrail blocks response', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockKnowledge.search).mockResolvedValue([]);
      vi.mocked(mockProvider.generate).mockResolvedValue({
        content: '',
        model: 'nova-lite',
        tokensUsed: 0,
        latencyMs: 50,
        guardrailAction: 'BLOCKED',
      });

      const result = await orchestrator.process(baseRequest);

      expect(result.answer).toContain("I'm sorry");
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('Complexity detection', () => {
    it('routes complex questions to complex model', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockKnowledge.search).mockResolvedValue([]);
      vi.mocked(mockProvider.generate).mockResolvedValue({
        content: 'Complex answer',
        model: 'claude-3-5-sonnet',
        tokensUsed: 500,
        latencyMs: 800,
        guardrailAction: 'NONE',
      });

      await orchestrator.process({ ...baseRequest, question: 'Can you explain the difference between the two programs?' });

      const call = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(call?.complexity).toBe('complex');
    });

    it('routes simple questions to simple model', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockKnowledge.search).mockResolvedValue([]);
      vi.mocked(mockProvider.generate).mockResolvedValue({
        content: 'Simple answer',
        model: 'nova-lite',
        tokensUsed: 50,
        latencyMs: 100,
        guardrailAction: 'NONE',
      });

      await orchestrator.process({ ...baseRequest, question: 'What is the tuition fee?' });

      const call = vi.mocked(mockProvider.generate).mock.calls[0]?.[0];
      expect(call?.complexity).toBe('simple');
    });
  });

  describe('Analytics', () => {
    it('records cache_hit analytics on cache hit', async () => {
      vi.mocked(mockCache.get).mockResolvedValue({
        cacheKey: 'key', question: 'q', answer: 'a', category: 'general',
        model: 'nova-lite', hitCount: 1, createdAt: '', updatedAt: '', expiresAt: 9999999999,
      });

      await orchestrator.process(baseRequest);

      expect(mockAnalytics.record).toHaveBeenCalledWith(
        expect.objectContaining({ metricType: 'cache_hit' }),
      );
    });

    it('does not fail if analytics throws', async () => {
      vi.mocked(mockCache.get).mockResolvedValue(null);
      vi.mocked(mockKnowledge.search).mockResolvedValue([]);
      vi.mocked(mockProvider.generate).mockResolvedValue({
        content: 'answer', model: 'nova-lite', tokensUsed: 10, latencyMs: 100, guardrailAction: 'NONE',
      });
      vi.mocked(mockAnalytics.record).mockRejectedValue(new Error('analytics down'));

      await expect(orchestrator.process(baseRequest)).resolves.toBeDefined();
    });
  });
});
