import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';

const repo = new DynamoAnalyticsRepository();

export const handler = createHandler(
  async ({ requestId }): Promise<APIGatewayProxyResult> => {
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const [aiEvents, cacheEvents] = await Promise.all([
      repo.query('ai_invocation', weekAgo, now),
      repo.query('cache_hit', weekAgo, now),
    ]);

    const totalRequests = aiEvents.length + cacheEvents.length;
    const cacheHitRate = totalRequests > 0
      ? Math.round((cacheEvents.length / totalRequests) * 100)
      : 0;
    const totalTokens = aiEvents.reduce((sum, e) => sum + ((e.metadata?.['tokensUsed'] as number) ?? 0), 0);

    return successResponse({
      totalRequests,
      aiInvocations: aiEvents.length,
      cacheHits: cacheEvents.length,
      cacheHitRate,
      totalTokensUsed: totalTokens,
      period: '7d',
    }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
