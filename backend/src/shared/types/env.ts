import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  AWS_REGION: z.string().min(1),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  DYNAMODB_TABLE_USERS: z.string().min(1),
  DYNAMODB_TABLE_CONVERSATIONS: z.string().min(1),
  DYNAMODB_TABLE_MESSAGES: z.string().min(1),
  DYNAMODB_TABLE_CACHE: z.string().min(1),
  DYNAMODB_TABLE_ANALYTICS: z.string().min(1),
  DYNAMODB_TABLE_FEEDBACK: z.string().min(1),
  DYNAMODB_TABLE_AUDIT: z.string().min(1),
  DYNAMODB_TABLE_KNOWLEDGE: z.string().min(1),

  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1),

  SQS_CHAT_QUEUE_URL: z.string().url(),
  SNS_ALERTS_TOPIC_ARN: z.string().min(1),
  SES_FROM_EMAIL: z.string().email(),

  BEDROCK_REGION: z.string().min(1),
  BEDROCK_MODEL_ROUTINE: z.string().default('amazon.nova-lite-v1:0'),
  BEDROCK_MODEL_COMPLEX: z.string().default('anthropic.claude-3-5-sonnet-20241022-v2:0'),
  BEDROCK_GUARDRAIL_ID: z.string().optional(),
  BEDROCK_GUARDRAIL_VERSION: z.string().default('DRAFT'),
  BEDROCK_KNOWLEDGE_BASE_ID: z.string().optional(),
  BEDROCK_KNOWLEDGE_DATA_SOURCE_ID: z.string().optional(),
  KNOWLEDGE_DOCS_BUCKET: z.string().optional(),

  DYNAMODB_ENDPOINT: z.string().url().optional(),
  COGNITO_ENDPOINT: z.string().url().optional(),
  SQS_ENDPOINT: z.string().url().optional(),
  SES_ENDPOINT: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check your environment variables.');
}

export const env = parsed.data;
export type Env = typeof env;
