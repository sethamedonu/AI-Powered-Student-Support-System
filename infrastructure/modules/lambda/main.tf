locals {
  prefix = "${var.app_name}-${var.environment}"

  common_env = {
    NODE_ENV                     = var.environment
    APP_NAME                     = "AI-Powered Student Support System"
    AWS_ACCOUNT_ID               = data.aws_caller_identity.current.account_id
    DYNAMODB_TABLE_USERS         = var.dynamodb_table_users
    DYNAMODB_TABLE_CONVERSATIONS = var.dynamodb_table_conversations
    DYNAMODB_TABLE_MESSAGES      = var.dynamodb_table_messages
    DYNAMODB_TABLE_CACHE         = var.dynamodb_table_cache
    DYNAMODB_TABLE_ANALYTICS     = var.dynamodb_table_analytics
    DYNAMODB_TABLE_FEEDBACK      = var.dynamodb_table_feedback
    DYNAMODB_TABLE_AUDIT         = var.dynamodb_table_audit
    DYNAMODB_TABLE_KNOWLEDGE     = var.dynamodb_table_knowledge
    COGNITO_USER_POOL_ID         = var.cognito_user_pool_id
    COGNITO_CLIENT_ID            = var.cognito_client_id
    SQS_CHAT_QUEUE_URL           = var.sqs_chat_queue_url
    SNS_ALERTS_TOPIC_ARN         = var.sns_alerts_topic_arn
    SES_FROM_EMAIL               = var.ses_from_email
    BEDROCK_REGION               = var.bedrock_region
    BEDROCK_GUARDRAIL_ID         = var.bedrock_guardrail_id
    LOG_LEVEL                    = var.environment == "prod" ? "info" : "debug"
  }

  functions = {
    health = {
      handler     = "health/index.handler"
      description = "Health check endpoint"
      timeout     = 10
      memory      = 128
    }
    auth-register = {
      handler     = "auth/register.handler"
      description = "User registration"
      timeout     = 30
      memory      = 256
    }
    auth-login = {
      handler     = "auth/login.handler"
      description = "User login"
      timeout     = 30
      memory      = 256
    }
    auth-verify = {
      handler     = "auth/verify.handler"
      description = "Email verification"
      timeout     = 30
      memory      = 256
    }
    auth-forgot-password = {
      handler     = "auth/forgotPassword.handler"
      description = "Forgot password flow"
      timeout     = 30
      memory      = 256
    }
    auth-reset-password = {
      handler     = "auth/resetPassword.handler"
      description = "Reset password"
      timeout     = 30
      memory      = 256
    }
    auth-refresh = {
      handler     = "auth/refresh.handler"
      description = "Refresh JWT tokens"
      timeout     = 30
      memory      = 256
    }
    chat-send = {
      handler     = "chat/send.handler"
      description = "Send a chat message and get AI response"
      timeout     = 60
      memory      = 512
    }
    chat-process = {
      handler     = "chat/process.handler"
      description = "Async SQS chat message processor"
      timeout     = 300
      memory      = 512
    }
    conversations-list = {
      handler     = "conversations/list.handler"
      description = "List user conversations"
      timeout     = 30
      memory      = 256
    }
    conversations-get = {
      handler     = "conversations/get.handler"
      description = "Get a single conversation with messages"
      timeout     = 30
      memory      = 256
    }
    conversations-delete = {
      handler     = "conversations/delete.handler"
      description = "Delete a conversation"
      timeout     = 30
      memory      = 256
    }
    feedback-submit = {
      handler     = "feedback/submit.handler"
      description = "Submit feedback for an AI response"
      timeout     = 30
      memory      = 256
    }
    analytics-get = {
      handler     = "analytics/get.handler"
      description = "Get analytics data (admin only)"
      timeout     = 30
      memory      = 256
    }
    admin-users-list = {
      handler     = "admin/listUsers.handler"
      description = "List all users (admin only)"
      timeout     = 30
      memory      = 256
    }
    admin-users-update = {
      handler     = "admin/updateUser.handler"
      description = "Update user role or status (admin only)"
      timeout     = 30
      memory      = 256
    }
    admin-knowledge-upsert = {
      handler     = "admin/upsertKnowledge.handler"
      description = "Create or update knowledge base entry (admin only)"
      timeout     = 30
      memory      = 256
    }
  }
}

data "aws_caller_identity" "current" {}

# ─── Lambda Functions ─────────────────────────────────────────────────────────
resource "aws_lambda_function" "functions" {
  for_each = local.functions

  function_name = "${local.prefix}-${each.key}"
  description   = each.value.description
  role          = var.lambda_execution_role_arn
  handler       = each.value.handler
  runtime       = "nodejs22.x"
  timeout       = each.value.timeout
  memory_size   = each.value.memory

  filename         = "${path.module}/placeholder.zip"
  source_code_hash = filebase64sha256("${path.module}/placeholder.zip")

  environment {
    variables = local.common_env
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }

  tags = {
    Name     = "${local.prefix}-${each.key}"
    Function = each.key
  }
}

# ─── SQS Event Source Mapping (chat-process) ─────────────────────────────────
resource "aws_lambda_event_source_mapping" "chat_sqs" {
  event_source_arn                   = var.sqs_chat_queue_arn
  function_name                      = aws_lambda_function.functions["chat-process"].arn
  batch_size                         = 1
  maximum_batching_window_in_seconds = 0
  enabled                            = true

  depends_on = [aws_lambda_function.functions]
}

# ─── CloudWatch Log Groups ────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.functions

  name              = "/aws/lambda/${local.prefix}-${each.key}"
  retention_in_days = var.environment == "prod" ? 90 : 14
}

# ─── Placeholder zip for initial deploy ──────────────────────────────────────
resource "null_resource" "placeholder_zip" {
  provisioner "local-exec" {
    command = "echo 'placeholder' > /tmp/placeholder.js && zip ${path.module}/placeholder.zip /tmp/placeholder.js"
  }

  lifecycle {
    create_before_destroy = true
  }
}
