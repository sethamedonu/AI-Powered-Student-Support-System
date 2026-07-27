import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoUserRepository } from '../../core/infrastructure/repositories/UserRepository.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';
import { nowIso } from '../../shared/utils/helpers.js';

const userRepo = new DynamoUserRepository();
const analyticsRepo = new DynamoAnalyticsRepository();

export const handler = createHandler(
  async ({ requestId }): Promise<APIGatewayProxyResult> => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [users, messageEvents, cacheHitEvents, aiCallEvents, todayEvents] = await Promise.all([
      userRepo.list({ limit: 1000 }),
      analyticsRepo.query('ai_invocation', '2000-01-01T00:00:00.000Z', nowIso()),
      analyticsRepo.query('cache_hit', '2000-01-01T00:00:00.000Z', nowIso()),
      analyticsRepo.query('ai_invocation', '2000-01-01T00:00:00.000Z', nowIso()),
      analyticsRepo.query('ai_invocation', todayStart.toISOString(), nowIso()),
    ]);

    const totalMessages = messageEvents.length + cacheHitEvents.length;
    const cacheHitRate = totalMessages > 0
      ? Math.round((cacheHitEvents.length / totalMessages) * 100)
      : 0;

    const latencies = aiCallEvents
      .map(e => (e.metadata?.['latencyMs'] as number) ?? 0)
      .filter(l => l > 0);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

    const activeUserIds = new Set(
      todayEvents.map(e => e.metadata?.['userId'] as string).filter(Boolean),
    );

    return successResponse({
      totalUsers: users.count,
      totalConversations: messageEvents.length,
      totalMessages,
      cacheHitRate,
      avgLatencyMs,
      activeToday: activeUserIds.size,
    }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
