import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';

const repo = new DynamoAnalyticsRepository();

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const qs = event.queryStringParameters ?? {};
    const metricType = qs['metricType'] ?? 'ai_invocation';
    const from = qs['from'] ?? new Date(Date.now() - 7 * 86400000).toISOString();
    const to = qs['to'] ?? new Date().toISOString();
    const events = await repo.query(metricType, from, to);
    return successResponse({ events, count: events.length }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
