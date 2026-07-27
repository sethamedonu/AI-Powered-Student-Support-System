import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { createHandler } from '../../src/shared/middleware/handler.js';
import { ValidationError, UnauthorizedError } from '../../src/shared/errors/index.js';

vi.mock('../../src/shared/middleware/auth.js', () => ({
  extractAuthContext: vi.fn().mockResolvedValue({
    userId: 'user-123',
    email: 'student@test.com',
    role: 'student',
    groups: ['Students'],
  }),
  requireRole: vi.fn(),
}));

const mockContext: Context = {
  awsRequestId: 'test-request-id',
  functionName: 'test-function',
  getRemainingTimeInMillis: () => 30000,
} as unknown as Context;

const mockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent =>
  ({
    httpMethod: 'GET',
    path: '/test',
    headers: { Authorization: 'Bearer test-token' },
    body: null,
    queryStringParameters: null,
    pathParameters: null,
    ...overrides,
  }) as unknown as APIGatewayProxyEvent;

describe('createHandler', () => {
  it('returns 204 for OPTIONS preflight', async () => {
    const handler = createHandler(async () => ({ statusCode: 200, body: '', headers: {} }));
    const result = await handler(mockEvent({ httpMethod: 'OPTIONS' }), mockContext);
    expect(result.statusCode).toBe(204);
  });

  it('calls handler fn and returns its result', async () => {
    const handler = createHandler(async ({ requestId }) => ({
      statusCode: 200,
      headers: {},
      body: JSON.stringify({ requestId }),
    }));

    const result = await handler(mockEvent(), mockContext);
    expect(result.statusCode).toBe(200);
  });

  it('returns 400 for ValidationError', async () => {
    const handler = createHandler(async () => {
      throw new ValidationError('Bad input');
    });

    const result = await handler(mockEvent(), mockContext);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 for UnauthorizedError', async () => {
    const handler = createHandler(async () => {
      throw new UnauthorizedError();
    });

    const result = await handler(mockEvent(), mockContext);
    expect(result.statusCode).toBe(401);
  });

  it('returns 500 for unhandled errors', async () => {
    const handler = createHandler(async () => {
      throw new Error('Something exploded');
    });

    const result = await handler(mockEvent(), mockContext);
    expect(result.statusCode).toBe(500);
  });

  it('returns 403 when requireAdmin is true and user is not admin', async () => {
    const handler = createHandler(
      async () => ({ statusCode: 200, headers: {}, body: '' }),
      { requireAdmin: true },
    );

    const result = await handler(mockEvent(), mockContext);
    expect(result.statusCode).toBe(403);
  });
});
