import type { APIGatewayProxyResult } from 'aws-lambda';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../../core/infrastructure/database/dynamoClient.js';
import { env } from '../../shared/types/env.js';
import type { Feedback } from '../../core/domain/entities/index.js';

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    const limit = Math.min(Number(event.queryStringParameters?.['limit'] ?? 20), 100);

    const result = await docClient.send(
      new ScanCommand({
        TableName: env.DYNAMODB_TABLE_FEEDBACK,
        Limit: limit,
      }),
    );

    const items = (result.Items as Feedback[]) ?? [];

    return successResponse({
      items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      count: result.Count ?? 0,
    }, 200, requestId);
  },
  { requireAuth: true, requireAdmin: true },
);
