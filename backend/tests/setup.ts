import { vi } from 'vitest';

// Mock environment variables for all tests
process.env['NODE_ENV'] = 'development';
process.env['AWS_REGION'] = 'us-east-1';
process.env['LOG_LEVEL'] = 'error';
process.env['DYNAMODB_TABLE_USERS'] = 'aisss-dev-users';
process.env['DYNAMODB_TABLE_CONVERSATIONS'] = 'aisss-dev-conversations';
process.env['DYNAMODB_TABLE_MESSAGES'] = 'aisss-dev-messages';
process.env['DYNAMODB_TABLE_CACHE'] = 'aisss-dev-response-cache';
process.env['DYNAMODB_TABLE_ANALYTICS'] = 'aisss-dev-analytics';
process.env['DYNAMODB_TABLE_FEEDBACK'] = 'aisss-dev-feedback';
process.env['DYNAMODB_TABLE_AUDIT'] = 'aisss-dev-audit-logs';
process.env['DYNAMODB_TABLE_KNOWLEDGE'] = 'aisss-dev-knowledge-base';
process.env['COGNITO_USER_POOL_ID'] = 'us-east-1_testpool';
process.env['COGNITO_CLIENT_ID'] = 'testclientid';
process.env['SQS_CHAT_QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue';
process.env['SNS_ALERTS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789:test-alerts';
process.env['SES_FROM_EMAIL'] = 'noreply@test.com';
process.env['BEDROCK_REGION'] = 'us-east-1';
process.env['BEDROCK_MODEL_ROUTINE'] = 'amazon.nova-lite-v1:0';
process.env['BEDROCK_MODEL_COMPLEX'] = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

// Mock AWS SDK clients globally
vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn().mockReturnValue({ send: vi.fn() }),
  },
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  UpdateCommand: vi.fn(),
  DeleteCommand: vi.fn(),
  QueryCommand: vi.fn(),
  ScanCommand: vi.fn(),
}));
