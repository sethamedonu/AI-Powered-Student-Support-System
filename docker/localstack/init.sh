#!/bin/bash
# LocalStack initialization script
# Runs automatically on container start via /etc/localstack/init/ready.d/

set -e

REGION="us-east-1"
ENDPOINT="http://localhost:4566"
ENV="dev"
APP="aisss"

echo ""
echo "========================================="
echo " AISSS LocalStack Initialization"
echo "========================================="

# ─── DynamoDB Tables ──────────────────────────────────────────────────────────

echo ""
echo "Creating DynamoDB tables..."

# Users table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-users" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "email-index",
    "KeySchema": [{"AttributeName":"email","KeyType":"HASH"}],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-users" || echo "  ⚠️  ${APP}-${ENV}-users already exists"

# Conversations table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-conversations" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=conversationId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=lastMessageAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=conversationId,KeyType=RANGE \
  --global-secondary-indexes '[{
    "IndexName": "status-lastMessageAt-index",
    "KeySchema": [
      {"AttributeName":"status","KeyType":"HASH"},
      {"AttributeName":"lastMessageAt","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-conversations" || echo "  ⚠️  ${APP}-${ENV}-conversations already exists"

# Messages table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-messages" \
  --attribute-definitions \
    AttributeName=conversationId,AttributeType=S \
    AttributeName=messageId,AttributeType=S \
  --key-schema \
    AttributeName=conversationId,KeyType=HASH \
    AttributeName=messageId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-messages" || echo "  ⚠️  ${APP}-${ENV}-messages already exists"

# Response cache table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-response-cache" \
  --attribute-definitions \
    AttributeName=cacheKey,AttributeType=S \
  --key-schema AttributeName=cacheKey,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-response-cache" || echo "  ⚠️  ${APP}-${ENV}-response-cache already exists"

# Analytics table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-analytics" \
  --attribute-definitions \
    AttributeName=metricType,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=metricType,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-analytics" || echo "  ⚠️  ${APP}-${ENV}-analytics already exists"

# Feedback table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-feedback" \
  --attribute-definitions \
    AttributeName=feedbackId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=feedbackId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "userId-createdAt-index",
    "KeySchema": [
      {"AttributeName":"userId","KeyType":"HASH"},
      {"AttributeName":"createdAt","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-feedback" || echo "  ⚠️  ${APP}-${ENV}-feedback already exists"

# Audit logs table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-audit-logs" \
  --attribute-definitions \
    AttributeName=auditId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema AttributeName=auditId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "userId-timestamp-index",
    "KeySchema": [
      {"AttributeName":"userId","KeyType":"HASH"},
      {"AttributeName":"timestamp","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-audit-logs" || echo "  ⚠️  ${APP}-${ENV}-audit-logs already exists"

# Knowledge base table
awslocal dynamodb create-table \
  --table-name "${APP}-${ENV}-knowledge-base" \
  --attribute-definitions \
    AttributeName=knowledgeId,AttributeType=S \
    AttributeName=category,AttributeType=S \
    AttributeName=updatedAt,AttributeType=S \
  --key-schema AttributeName=knowledgeId,KeyType=HASH \
  --global-secondary-indexes '[{
    "IndexName": "category-updatedAt-index",
    "KeySchema": [
      {"AttributeName":"category","KeyType":"HASH"},
      {"AttributeName":"updatedAt","KeyType":"RANGE"}
    ],
    "Projection": {"ProjectionType":"ALL"}
  }]' \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-knowledge-base" || echo "  ⚠️  ${APP}-${ENV}-knowledge-base already exists"

# ─── SQS Queues ───────────────────────────────────────────────────────────────

echo ""
echo "Creating SQS queues..."

# Dead letter queue first
awslocal sqs create-queue \
  --queue-name "${APP}-${ENV}-chat-dlq" \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-chat-dlq" || echo "  ⚠️  DLQ already exists"

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "http://localhost:4566/000000000000/${APP}-${ENV}-chat-dlq" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text \
  --region $REGION 2>/dev/null || echo "")

# Main chat queue with DLQ redrive
awslocal sqs create-queue \
  --queue-name "${APP}-${ENV}-chat-queue" \
  --attributes "{\"VisibilityTimeout\":\"300\",\"MessageRetentionPeriod\":\"86400\",\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}" \
  --region $REGION \
  2>/dev/null && echo "  ✅ ${APP}-${ENV}-chat-queue" || echo "  ⚠️  Chat queue already exists"

QUEUE_URL="http://localhost:4566/000000000000/${APP}-${ENV}-chat-queue"
echo "  Queue URL: $QUEUE_URL"

# ─── Cognito User Pool ────────────────────────────────────────────────────────

echo ""
echo "Creating Cognito user pool..."

POOL_ID=$(awslocal cognito-idp create-user-pool \
  --pool-name "${APP}-${ENV}-user-pool" \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":true,"RequireLowercase":true,"RequireNumbers":true,"RequireSymbols":false}}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --region $REGION \
  --query 'UserPool.Id' \
  --output text \
  2>/dev/null || echo "")

if [ -n "$POOL_ID" ]; then
  echo "  ✅ User pool created: $POOL_ID"

  CLIENT_ID=$(awslocal cognito-idp create-user-pool-client \
    --user-pool-id "$POOL_ID" \
    --client-name "${APP}-${ENV}-client" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
    --region $REGION \
    --query 'UserPoolClient.ClientId' \
    --output text \
    2>/dev/null || echo "")

  echo "  ✅ App client created: $CLIENT_ID"

  # Create a test admin user
  awslocal cognito-idp admin-create-user \
    --user-pool-id "$POOL_ID" \
    --username "admin@test.com" \
    --temporary-password "Admin123!" \
    --user-attributes Name=email,Value=admin@test.com Name=given_name,Value=Admin Name=family_name,Value=User Name=email_verified,Value=true \
    --message-action SUPPRESS \
    --region $REGION \
    2>/dev/null && echo "  ✅ Test admin user: admin@test.com / Admin123!" || echo "  ⚠️  Test user already exists"

  # Create a test student user
  awslocal cognito-idp admin-create-user \
    --user-pool-id "$POOL_ID" \
    --username "student@test.com" \
    --temporary-password "Student123!" \
    --user-attributes Name=email,Value=student@test.com Name=given_name,Value=Test Name=family_name,Value=Student Name=email_verified,Value=true \
    --message-action SUPPRESS \
    --region $REGION \
    2>/dev/null && echo "  ✅ Test student user: student@test.com / Student123!" || echo "  ⚠️  Test user already exists"

  echo ""
  echo "  ⚠️  Add these to your .env file:"
  echo "  COGNITO_USER_POOL_ID=$POOL_ID"
  echo "  COGNITO_CLIENT_ID=$CLIENT_ID"
  echo "  SQS_CHAT_QUEUE_URL=$QUEUE_URL"
else
  echo "  ⚠️  Cognito user pool already exists or creation failed"
fi

# ─── Seed knowledge base ──────────────────────────────────────────────────────

echo ""
echo "Seeding knowledge base..."

awslocal dynamodb put-item \
  --table-name "${APP}-${ENV}-knowledge-base" \
  --item '{
    "knowledgeId": {"S": "kb-001"},
    "category": {"S": "tuition"},
    "title": {"S": "Undergraduate Tuition Fees"},
    "content": {"S": "Undergraduate tuition is $5,000 per semester for full-time students (12-18 credits). Part-time students pay $420 per credit hour. Fees include access to campus facilities, library, and student services."},
    "keywords": {"SS": ["tuition", "fees", "cost", "undergraduate", "semester", "credits"]},
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00.000Z"}
  }' \
  --region $REGION 2>/dev/null && echo "  ✅ Tuition FAQ" || echo "  ⚠️  Tuition FAQ already exists"

awslocal dynamodb put-item \
  --table-name "${APP}-${ENV}-knowledge-base" \
  --item '{
    "knowledgeId": {"S": "kb-002"},
    "category": {"S": "admissions"},
    "title": {"S": "Admission Requirements"},
    "content": {"S": "To apply for undergraduate admission you need: completed application form, high school transcripts with minimum GPA of 2.5, SAT/ACT scores (optional for 2024-2025), two letters of recommendation, and a personal statement. Applications open September 1 and close January 15 for fall admission."},
    "keywords": {"SS": ["admission", "apply", "requirements", "gpa", "sat", "act", "application"]},
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00.000Z"}
  }' \
  --region $REGION 2>/dev/null && echo "  ✅ Admissions FAQ" || echo "  ⚠️  Admissions FAQ already exists"

awslocal dynamodb put-item \
  --table-name "${APP}-${ENV}-knowledge-base" \
  --item '{
    "knowledgeId": {"S": "kb-003"},
    "category": {"S": "registration"},
    "title": {"S": "Course Registration Process"},
    "content": {"S": "Course registration opens 4 weeks before each semester. Log in to the student portal, navigate to Registration, and select your courses. You need advisor approval for courses above 18 credits. Add/drop period ends 2 weeks after semester start. Late registration incurs a $50 fee."},
    "keywords": {"SS": ["registration", "courses", "enroll", "add", "drop", "portal", "advisor"]},
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"},
    "updatedAt": {"S": "2024-01-01T00:00:00.000Z"}
  }' \
  --region $REGION 2>/dev/null && echo "  ✅ Registration FAQ" || echo "  ⚠️  Registration FAQ already exists"

echo ""
echo "========================================="
echo " ✅ LocalStack initialization complete!"
echo "========================================="
echo ""
