import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

vi.mock('../../src/shared/middleware/auth.js', () => ({
  extractAuthContext: vi.fn().mockResolvedValue({
    userId: 'user-abc',
    email: 'student@test.com',
    role: 'student',
    groups: ['Students'],
  }),
  requireRole: vi.fn(),
}));

vi.mock('../../src/core/infrastructure/repositories/index.js', () => ({
  DynamoFeedbackRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue(undefined),
  })),
  DynamoAnalyticsRepository: vi.fn().mockImplementation(() => ({
    record: vi.fn().mockResolvedValue(undefined),
  })),
  DynamoUserRepository: vi.fn().mockImplementation(() => ({})),
  DynamoConversationRepository: vi.fn().mockImplementation(() => ({})),
  DynamoMessageRepository: vi.fn().mockImplementation(() => ({})),
  DynamoCacheRepository: vi.fn().mockImplementation(() => ({})),
  DynamoKnowledgeRepository: vi.fn().mockImplementation(() => ({})),
}));

const mockContext: Context = {
  awsRequestId: 'req-feedback-test',
  functionName: 'feedback-submit',
  getRemainingTimeInMillis: () => 30000,
} as unknown as Context;

const mockEvent = (body: unknown): APIGatewayProxyEvent =>
  ({
    httpMethod: 'POST',
    path: '/feedback',
    headers: { Authorization: 'Bearer token' },
    body: JSON.stringify(body),
    queryStringParameters: null,
    pathParameters: null,
  }) as unknown as APIGatewayProxyEvent;

describe('feedback/submit handler', () => {
  let handler: (event: APIGatewayProxyEvent, ctx: Context) => Promise<{ statusCode: number; body: string }>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../../src/functions/feedback/submit.js');
    handler = mod.handler as typeof handler;
  });

  it('returns 201 with feedbackId on valid input', async () => {
    const res = await handler(
      mockEvent({ rating: 5, category: 'general', comment: 'Great support system!' }),
      mockContext,
    );
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body) as { success: boolean; data: { feedbackId: string } };
    expect(body.success).toBe(true);
    expect(body.data.feedbackId).toBeDefined();
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await handler(
      mockEvent({ rating: 6, category: 'general', comment: 'Great support system!' }),
      mockContext,
    );
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when comment is too short', async () => {
    const res = await handler(
      mockEvent({ rating: 3, category: 'general', comment: 'Short' }),
      mockContext,
    );
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when body is missing', async () => {
    const event = mockEvent(null);
    event.body = null;
    const res = await handler(event, mockContext);
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when body is invalid JSON', async () => {
    const event = { ...mockEvent({}), body: 'not-json' } as unknown as APIGatewayProxyEvent;
    const res = await handler(event, mockContext);
    expect(res.statusCode).toBe(400);
  });

  it('accepts optional conversationId', async () => {
    const res = await handler(
      mockEvent({
        rating: 4,
        category: 'admissions',
        comment: 'Very helpful response!',
        conversationId: '550e8400-e29b-41d4-a716-446655440000',
      }),
      mockContext,
    );
    expect(res.statusCode).toBe(201);
  });

  it('returns 204 for OPTIONS preflight', async () => {
    const event = { ...mockEvent({}), httpMethod: 'OPTIONS' } as unknown as APIGatewayProxyEvent;
    const res = await handler(event, mockContext);
    expect(res.statusCode).toBe(204);
  });
});
