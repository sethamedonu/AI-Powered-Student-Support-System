locals {
  prefix = "${var.app_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ─── Lambda Execution Role ────────────────────────────────────────────────────
resource "aws_iam_role" "lambda_execution" {
  name = "${local.prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# ─── CloudWatch Logs Policy ───────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_cloudwatch" {
  name = "${local.prefix}-lambda-cloudwatch-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.prefix}-*:*"
      }
    ]
  })
}

# ─── DynamoDB Policy ──────────────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:TransactGetItems",
          "dynamodb:DescribeTable",
        ]
        Resource = [
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${local.prefix}-*",
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${local.prefix}-*/index/*",
        ]
      }
    ]
  })
}

# ─── Bedrock Policy ───────────────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "${local.prefix}-lambda-bedrock-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Invoke AI models (Nova Lite, Claude Sonnet via cross-region profile)
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:ApplyGuardrail",
        ]
        Resource = [
          "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/amazon.nova-lite-v1:0",
          "arn:aws:bedrock:${data.aws_region.current.name}::foundation-model/amazon.titan-embed-text-v2:0",
          "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:inference-profile/us.*",
          "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:guardrail/*",
        ]
      },
      {
        # Query the Knowledge Base via the Bedrock Agent Runtime API
        # Used by chat-send / chat-process to retrieve relevant document chunks
        Effect = "Allow"
        Action = [
          "bedrock:Retrieve",
          "bedrock:RetrieveAndGenerate",
        ]
        Resource = "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:knowledge-base/*"
      },
      {
        # Start ingestion jobs after document upload (admin-knowledge-upsert Lambda)
        Effect   = "Allow"
        Action   = ["bedrock:StartIngestionJob", "bedrock:GetIngestionJob"]
        Resource = "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:knowledge-base/*"
      },
    ]
  })
}

# ─── S3 Knowledge Documents Policy ───────────────────────────────────────────
# Allows admin Lambdas to generate pre-signed URLs and list the documents bucket
resource "aws_iam_role_policy" "lambda_s3_knowledge" {
  name = "${local.prefix}-lambda-s3-knowledge-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
        ]
        Resource = [
          "arn:aws:s3:::${local.prefix}-knowledge-docs-${data.aws_caller_identity.current.account_id}",
          "arn:aws:s3:::${local.prefix}-knowledge-docs-${data.aws_caller_identity.current.account_id}/*",
        ]
      },
    ]
  })
}

# ─── SQS Policy ───────────────────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_sqs" {
  name = "${local.prefix}-lambda-sqs-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility",
        ]
        Resource = "arn:aws:sqs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.prefix}-*"
      }
    ]
  })
}

# ─── SES Policy ───────────────────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_ses" {
  name = "${local.prefix}-lambda-ses-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

# ─── SNS Policy ───────────────────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_sns" {
  name = "${local.prefix}-lambda-sns-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${local.prefix}-*"
      }
    ]
  })
}

# ─── Cognito Policy ───────────────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_cognito" {
  name = "${local.prefix}-lambda-cognito-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminListGroupsForUser",
          "cognito-idp:ListUsers",
        ]
        Resource = "arn:aws:cognito-idp:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:userpool/*"
      }
    ]
  })
}
