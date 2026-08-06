import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';
import { createLogger } from '../../shared/utils/logger.js';

const repo = new DynamoAnalyticsRepository();
const logger = createLogger('getAnalytics');

interface MetricRow {
  date: string;
  messages: number;
  cacheHits: number;
  aiCalls: number;
}

interface AnalyticsResponse {
  period: string;
  metrics: MetricRow[];
  topCategories: { category: string; count: number }[];
  modelUsage: { model: string; count: number }[];
}

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const qs = event.queryStringParameters ?? {};
    const period = qs['period'] ?? 'week';
    
    logger.info('Analytics request received', { period });

    // Calculate date range based on period
    const periodMs: Record<string, number> = {
      day: 86400000,
      week: 7 * 86400000,
      month: 30 * 86400000,
    };
    
    const rangeMs = periodMs[period] ?? periodMs['week'] ?? 7 * 86400000;
    const from = qs['from'] ?? new Date(Date.now() - rangeMs).toISOString();
    const to = qs['to'] ?? new Date().toISOString();

    logger.info('Querying analytics data', { from, to, rangeMs });

    // Query all relevant analytics events in parallel
    const [aiEvents, cacheEvents] = await Promise.all([
      repo.query('ai_invocation', from, to),
      repo.query('cache_hit', from, to),
    ]);

    logger.info('Analytics events retrieved', {
      aiEventsCount: aiEvents.length,
      cacheEventsCount: cacheEvents.length,
    });

    // Aggregate metrics by date
    const metricsByDate = new Map<string, MetricRow>();
    const categoryCount = new Map<string, number>();
    const modelCount = new Map<string, number>();

    // Process AI invocation events
    for (const event of aiEvents) {
      const date = event.date ?? event.timestamp.split('T')[0] ?? '';
      const existing = metricsByDate.get(date) ?? {
        date,
        messages: 0,
        cacheHits: 0,
        aiCalls: 0,
      };

      existing.messages += 1;
      existing.aiCalls += 1;
      metricsByDate.set(date, existing);

      // Track categories
      const category = (event.metadata?.['category'] as string) ?? 'general';
      categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);

      // Track model usage
      const model = (event.metadata?.['model'] as string) ?? 'unknown';
      modelCount.set(model, (modelCount.get(model) ?? 0) + 1);
    }

    // Process cache hit events
    for (const event of cacheEvents) {
      const date = event.date ?? event.timestamp.split('T')[0] ?? '';
      const existing = metricsByDate.get(date) ?? {
        date,
        messages: 0,
        cacheHits: 0,
        aiCalls: 0,
      };

      existing.messages += 1;
      existing.cacheHits += 1;
      metricsByDate.set(date, existing);

      // Track categories for cache hits too
      const category = (event.metadata?.['category'] as string) ?? 'general';
      categoryCount.set(category, (categoryCount.get(category) ?? 0) + 1);
    }

    // Sort metrics by date
    const metrics = Array.from(metricsByDate.values()).sort(
      (a, b) => a.date.localeCompare(b.date),
    );

    // Sort categories by count (top 5)
    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort models by count
    const modelUsage = Array.from(modelCount.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    logger.info('Analytics aggregation complete', {
      metricsCount: metrics.length,
      topCategoriesCount: topCategories.length,
      modelUsageCount: modelUsage.length,
    });

    const response: AnalyticsResponse = {
      period,
      metrics,
      topCategories,
      modelUsage,
    };

    return successResponse(response, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
