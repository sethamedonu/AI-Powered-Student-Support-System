locals {
  prefix = "${var.app_name}-${var.environment}"
}

# ─── Dead Letter Queue ────────────────────────────────────────────────────────
resource "aws_sqs_queue" "chat_dlq" {
  name                      = "${local.prefix}-chat-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = {
    Name = "${local.prefix}-chat-dlq"
  }
}

# ─── Chat Processing Queue ────────────────────────────────────────────────────
resource "aws_sqs_queue" "chat_queue" {
  name                       = "${local.prefix}-chat-queue"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400 # 1 day
  receive_wait_time_seconds  = 20    # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.chat_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name = "${local.prefix}-chat-queue"
  }
}
