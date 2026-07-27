import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/index.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';
import { nowIso } from '../../shared/utils/helpers.js';

const repo = new DynamoAnalyticsRepository();

type Period = 'day' | 'week' | 'month';

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === 'day') {
    now.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    now.setDate(now.getDate() - 6);
    now.setHours(0, 0, 0, 0);
  } else {
    now.setDate(now.getDate() - 29);
    now.setHours(0, 0, 0, 0);
  }
  return now;
}

function getDates(from: Date, to: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    dates.push(cur.toISOString().split('T')[0]!);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const period = (event.queryStringParameters?.['period'] ?? 'week') as Period;
    if (!['day', 'week', 'month'].includes(period)) {
      throw new ValidationError('period must be day, week, or month');
    }

    const from = getPeriodStart(period);
    const to = new Date();

    const [messageEvents, cacheHitEvents] = await Promise.all([
      repo.query('ai_invocation', from.toISOString(), nowIso()),
      repo.query('cache_hit', from.toISOString(), nowIso()),
    ]);

    const dates = getDates(from, to);

    // Aggregate by date
    const byDate = new Map<string, { messages: number; cacheHits: number; aiCalls: number }>();
    for (const d of dates) {
      byDate.set(d, { messages: 0, cacheHits: 0, aiCalls: 0 });
    }

    for (const e of messageEvents) {
      const d = e.date;
      const row = byDate.get(d);
      if (row) { row.messages++; row.aiCalls++; }
    }
    for (const e of cacheHitEvents) {
      const d = e.date;
      const row = byDate.get(d);
      if (row) { row.messages++; row.cacheHits++; }
    }

    const metrics = dates.map(d => ({
      date: `${d}T00:00:00.000Z`,
      ...(byDate.get(d) ?? { messages: 0, cacheHits: 0, aiCalls: 0 }),
    }));

    // Top categories from metadata
    const categoryCounts = new Map<string, number>();
    for (const e of [...messageEvents, ...cacheHitEvents]) {
      const cat = (e.metadata?.['category'] as string) ?? 'general';
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }
    const topCategories = [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({ category, count }));

    // Model usage from metadata
    const modelCounts = new Map<string, number>();
    for (const e of messageEvents) {
      const model = (e.metadata?.['model'] as string) ?? 'unknown';
      modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
    }
    const modelUsage = [...modelCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([model, count]) => ({ model, count }));

    return successResponse({ period, metrics, topCategories, modelUsage }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
