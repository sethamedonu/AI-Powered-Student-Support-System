import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const repo = new DynamoAnalyticsRepository();
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

const USERS_TABLE = process.env.USERS_TABLE ?? '';
const CONVERSATIONS_TABLE = process.env.CONVERSATIONS_TABLE ?? '';
const MESSAGES_TABLE = process.env.MESSAGES_TABLE ?? '';

export const handler = createHandler(
  async ({ requestId }): Promise<APIGatewayProxyResult> => {
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    // Parallel queries: analytics events + DynamoDB counts
    const [aiEvents, cacheEvents, usersResult, convsResult, msgsResult] = await Promise.all([
      repo.query('ai_invocation', weekAgo, now),
      repo.query('cache_hit', weekAgo, now),
      dynamoClient.send(new ScanCommand({ TableName: USERS_TABLE, Select: 'COUNT' })),
      dynamoClient.send(new ScanCommand({ TableName: CONVERSATIONS_TABLE, Select: 'COUNT' })),
      dynamoClient.send(new ScanCommand({ TableName: MESSAGES_TABLE, Select: 'COUNT' })),
    ]);

    // Cache hit rate
    const totalRequests = aiEvents.length + cacheEvents.length;
    const cacheHitRate = totalRequests > 0
      ? Math.round((cacheEvents.length / totalRequests) * 100)
      : 0;

    // Average latency from AI invocations
    const latencies = aiEvents
      .map(e => (e.metadata?.['latencyMs'] as number) ?? 0)
      .filter(l => l > 0);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
      : 0;

    // Active today: AI invocations created today (users who sent messages)
    const activeToday = aiEvents.filter(e => e.timestamp >= todayISO).length;

    return successResponse({
      totalUsers: usersResult.Count ?? 0,
      totalConversations: convsResult.Count ?? 0,
      totalMessages: msgsResult.Count ?? 0,
      cacheHitRate,
      avgLatencyMs,
      activeToday,
    }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
