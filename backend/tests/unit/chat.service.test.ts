import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from '../../src/core/application/services/chat.service.js';
import type { IConversationRepository, IMessageRepository } from '../../src/core/domain/repositories/index.js';
import type { AIOrchestrator } from '../../src/core/infrastructure/ai/orchestrator.js';

const mockConversationRepo: IConversationRepository = {
  findById: vi.fn(),
  listByUser: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockMessageRepo: IMessageRepository = {
  findById: vi.fn(),
  listByConversation: vi.fn(),
  create: vi.fn(),
  deleteByConversation: vi.fn(),
};

const mockOrchestrator = {
  process: vi.fn(),
} as unknown as AIOrchestrator;

const mockConversation = {
  userId: 'user-1',
  conversationId: 'conv-1',
  title: 'Test',
  status: 'active' as const,
  messageCount: 0,
  lastMessageAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ChatService(mockConversationRepo, mockMessageRepo, mockOrchestrator);

    vi.mocked(mockMessageRepo.listByConversation).mockResolvedValue({ items: [], count: 0 });
    vi.mocked(mockMessageRepo.create).mockImplementation(async (input) => ({
      ...input, createdAt: '2024-01-01T00:00:00.000Z',
    }));
    vi.mocked(mockOrchestrator.process).mockResolvedValue({
      answer: 'The tuition is $5000 per semester.',
      model: 'nova-lite',
      cacheStatus: 'miss',
      tokensUsed: 120,
      latencyMs: 250,
    });
  });

  it('creates a new conversation when no conversationId provided', async () => {
    vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);
    vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

    const result = await service.sendMessage('user-1', { message: 'What is the tuition?' });

    expect(mockConversationRepo.create).toHaveBeenCalledOnce();
    expect(result.answer).toBe('The tuition is $5000 per semester.');
    expect(result.cacheStatus).toBe('miss');
  });

  it('reuses existing conversation when conversationId provided', async () => {
    vi.mocked(mockConversationRepo.findById).mockResolvedValue(mockConversation);
    vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

    await service.sendMessage('user-1', { conversationId: 'conv-1', message: 'Follow up question' });

    expect(mockConversationRepo.create).not.toHaveBeenCalled();
    expect(mockConversationRepo.findById).toHaveBeenCalledWith('user-1', 'conv-1');
  });

  it('creates conversation if provided conversationId does not exist', async () => {
    vi.mocked(mockConversationRepo.findById).mockResolvedValue(null);
    vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);
    vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

    await service.sendMessage('user-1', { conversationId: 'conv-new', message: 'Hello' });

    expect(mockConversationRepo.create).toHaveBeenCalledOnce();
  });

  it('persists both user and assistant messages', async () => {
    vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);
    vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

    await service.sendMessage('user-1', { message: 'What is the tuition?' });

    expect(mockMessageRepo.create).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(mockMessageRepo.create).mock.calls;
    expect(calls[0]?.[0].role).toBe('user');
    expect(calls[1]?.[0].role).toBe('assistant');
  });

  it('passes conversation history to orchestrator', async () => {
    vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);
    vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);
    vi.mocked(mockMessageRepo.listByConversation).mockResolvedValue({
      items: [
        { conversationId: 'c1', messageId: 'm1', role: 'user', content: 'Previous question', createdAt: '' },
        { conversationId: 'c1', messageId: 'm2', role: 'assistant', content: 'Previous answer', createdAt: '' },
      ],
      count: 2,
    });

    await service.sendMessage('user-1', { message: 'New question' });

    const orchestratorCall = vi.mocked(mockOrchestrator.process).mock.calls[0]?.[0];
    expect(orchestratorCall?.conversationHistory).toHaveLength(2);
  });

  it('returns correct response shape', async () => {
    vi.mocked(mockConversationRepo.create).mockResolvedValue(mockConversation);
    vi.mocked(mockConversationRepo.update).mockResolvedValue(mockConversation);

    const result = await service.sendMessage('user-1', { message: 'Test' });

    expect(result).toMatchObject({
      conversationId: expect.any(String),
      messageId: expect.any(String),
      answer: expect.any(String),
      model: expect.any(String),
      cacheStatus: expect.stringMatching(/^(hit|miss)$/),
      tokensUsed: expect.any(Number),
      latencyMs: expect.any(Number),
    });
  });
});
