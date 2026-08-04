# ─── Import manually-created DynamoDB CloudWatch alarms ──────────────────────
# These alarms were created in the AWS console before being codified in Terraform.
# This import block runs once and is safe to keep in the codebase — Terraform
# skips imports for resources already in state.

# NOTE: AISSS-DynamoDB-Users-ConsumedReadCapacityUnits and
# AISSS-DynamoDB-ResponseCache-ConsumedReadCapacityUnits were created manually
# with an uppercase prefix. Terraform will recreate them under the consistent
# lowercase naming (aisss-DynamoDB-*). The old uppercase alarms will be deleted
# by this apply and replaced with the Terraform-managed versions below.
#
# All other 14 alarms match the Terraform naming exactly and are imported.

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_read["conversations"]
  id = "aisss-DynamoDB-Conversations-ConsumedReadCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_read["messages"]
  id = "aisss-DynamoDB-Messages-ConsumedReadCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_read["analytics"]
  id = "aisss-DynamoDB-Analytics-ConsumedReadCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_read["feedback"]
  id = "aisss-DynamoDB-Feedback-ConsumedReadCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_read["audit"]
  id = "aisss-DynamoDB-AuditLogs-ConsumedReadCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_read["knowledge"]
  id = "aisss-DynamoDB-KnowledgeBase-ConsumedReadCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["users"]
  id = "aisss-dev-DynamoDB-Users-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["conversations"]
  id = "aisss-DynamoDB-Conversations-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["messages"]
  id = "aisss-DynamoDB-Messages-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["cache"]
  id = "aisss-DynamoDB-ResponseCache-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["analytics"]
  id = "aisss-DynamoDB-Analytics-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["feedback"]
  id = "aisss-DynamoDB-Feedback-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["audit"]
  id = "aisss-DynamoDB-AuditLogs-ConsumedWriteCapacityUnits"
}

import {
  to = module.cloudwatch.aws_cloudwatch_metric_alarm.dynamodb_write["knowledge"]
  id = "aisss-DynamoDB-KnowledgeBase-ConsumedWriteCapacityUnits"
}
