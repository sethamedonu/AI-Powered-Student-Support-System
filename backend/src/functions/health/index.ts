import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { env } from '../../shared/types/env.js';
import { docClient } from '../../core/infrastructure/database/dynamoClient.js';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamo = new DynamoDBClient({ region: env.AWS_REGION });
const sqs = new SQSClient({ region: env.AWS_REGION });

async function checkDynamo(): Promise<{ status: 'ok' | 'error'; latencyMs: number }> {
  const start = Date.now();
  try {
    await dynamo.send(new DescribeTableCommand({ TableName: env.DYNAMODB_TABLE_USERS }));
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  }
}

async function checkSQS(): Promise<{ status: 'ok' | 'error'; latencyMs: number }> {
  const start = Date.now();
  try {
    await sqs.send(new GetQueueAttributesCommand({
      QueueUrl: env.SQS_CHAT_QUEUE_URL,
      AttributeNames: ['ApproximateNumberOfMessages'],
    }));
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', latencyMs: Date.now() - start };
  }
}

export const handler = createHandler(
  async ({ requestId }) => {
    const [dynamoCheck, sqsCheck] = await Promise.all([
      checkDynamo(),
      checkSQS(),
    ]);

    const allHealthy = dynamoCheck.status === 'ok' && sqsCheck.status === 'ok';

    return successResponse(
      {
        status: allHealthy ? 'healthy' : 'degraded',
        environment: env.NODE_ENV,
        region: env.AWS_REGION,
        timestamp: new Date().toISOString(),
        checks: {
          dynamodb: dynamoCheck,
          sqs: sqsCheck,
        },
      },
      allHealthy ? 200 : 503,
      requestId,
    );
  },
  { requireAuth: false },
);
