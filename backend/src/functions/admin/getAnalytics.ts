import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';

const repo = new DynamoAnalyticsRepository();

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const qs = event.queryStringParameters ?? {};
    const period = qs['period'] ?? 'week';
    const periodMs: Record<string, number> = { day: 86400000, week: 7 * 86400000, month: 30 * 86400000 };
    const rangeMs = periodMs[period] ?? periodMs['week'];
    const from = qs['from'] ?? new Date(Date.now() - rangeMs).toISOString();
    const to = qs['to'] ?? new Date().toISOString();

    const [aiEvents, cacheEvents] = await Promise.all([
      repo.query('ai_invocation', from, to),
      repo.query('cache_hit', from, to),
    ]);

    return successResponse({ aiEvents, cacheEvents, from, to }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
