import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

vi.mock('../../src/shared/middleware/auth.js', () => ({
  extractAuthContext: vi.fn().mockResolvedValue(null),
  requireRole: vi.fn(),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ Table: { TableStatus: 'ACTIVE' } }),
  })),
  DescribeTableCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ Attributes: { ApproximateNumberOfMessages: '0' } }),
  })),
  GetQueueAttributesCommand: vi.fn(),
}));

const mockContext: Context = {
  awsRequestId: 'req-health-test',
  functionName: 'health',
  getRemainingTimeInMillis: () => 30000,
} as unknown as Context;

const mockEvent = (method = 'GET'): APIGatewayProxyEvent =>
  ({
    httpMethod: method,
    path: '/health',
    headers: {},
    body: null,
    queryStringParameters: null,
    pathParameters: null,
  }) as unknown as APIGatewayProxyEvent;

describe('health handler', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 200 with healthy status when all checks pass', async () => {
    const { handler } = await import('../../src/functions/health/index.js');
    const res = await (handler as Function)(mockEvent(), mockContext);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      success: boolean;
      data: { status: string; checks: { dynamodb: { status: string }; sqs: { status: string } } };
    };
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('healthy');
    expect(body.data.checks.dynamodb.status).toBe('ok');
    expect(body.data.checks.sqs.status).toBe('ok');
  });

  it('returns 503 with degraded status when DynamoDB fails', async () => {
    vi.doMock('@aws-sdk/client-dynamodb', () => ({
      DynamoDBClient: vi.fn().mockImplementation(() => ({
        send: vi.fn().mockRejectedValue(new Error('DynamoDB unavailable')),
      })),
      DescribeTableCommand: vi.fn(),
    }));

    const { handler } = await import('../../src/functions/health/index.js');
    const res = await (handler as Function)(mockEvent(), mockContext);
    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body) as { data: { status: string } };
    expect(body.data.status).toBe('degraded');
  });

  it('returns 503 with degraded status when SQS fails', async () => {
    vi.doMock('@aws-sdk/client-sqs', () => ({
      SQSClient: vi.fn().mockImplementation(() => ({
        send: vi.fn().mockRejectedValue(new Error('SQS unavailable')),
      })),
      GetQueueAttributesCommand: vi.fn(),
    }));

    const { handler } = await import('../../src/functions/health/index.js');
    const res = await (handler as Function)(mockEvent(), mockContext);
    expect(res.statusCode).toBe(503);
  });

  it('returns 204 for OPTIONS preflight', async () => {
    const { handler } = await import('../../src/functions/health/index.js');
    const res = await (handler as Function)(mockEvent('OPTIONS'), mockContext);
    expect(res.statusCode).toBe(204);
  });

  it('includes environment and region in response', async () => {
    const { handler } = await import('../../src/functions/health/index.js');
    const res = await (handler as Function)(mockEvent(), mockContext);
    const body = JSON.parse(res.body) as { data: { environment: string; region: string; timestamp: string } };
    expect(body.data.environment).toBeDefined();
    expect(body.data.region).toBeDefined();
    expect(body.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
