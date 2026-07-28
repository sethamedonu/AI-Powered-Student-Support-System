import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { DynamoAnalyticsRepository } from '../../core/infrastructure/repositories/index.js';
import { nowIso } from '../../shared/utils/helpers.js';

const repo = new DynamoAnalyticsRepository();

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const metricType = event.queryStringParameters?.['metricType'] ?? 'ai_invocation';
    const from = event.queryStringParameters?.['from'] ?? new Date(Date.now() - 7 * 86400000).toISOString();
    const to = event.queryStringParameters?.['to'] ?? nowIso();

    const events = await repo.query(metricType, from, to);
    return successResponse({ metricType, from, to, events, count: events.length }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
