locals {
  prefix = "${var.app_name}-${var.environment}"

  # ── Per-function duration thresholds (ms) ────────────────────────────────
  # chat-send   invokes Amazon Bedrock synchronously — p99 can legitimately
  #             reach 15-20 s even on a warm container. Alarm at 30 s.
  # chat-process is an async SQS consumer with a 300 s timeout — alarm at 60 s.
  # Everything else is a fast DynamoDB / Cognito call — alarm at 10 s.
  function_duration_thresholds = {
    for fn in var.lambda_function_names :
    fn => (
      endswith(fn, "chat-process") ? var.lambda_chat_process_duration_threshold_ms :
      endswith(fn, "chat-send") ? var.lambda_chat_duration_threshold_ms :
      var.lambda_duration_threshold_ms
    )
  }

  # ── DynamoDB table → alarm configuration ─────────────────────────────────
  # Thresholds are set per access pattern:
  #
  # users / conversations — low-volume writes (registrations, new chats).
  #   Read:  10 000 CU  — dashboard/admin reads can spike briefly
  #   Write: 1 000 CU   — new user registrations are infrequent
  #
  # messages — highest read traffic (every chat view loads messages).
  #   Read:  10 000 CU  — expected during active sessions
  #   Write: 1 000 CU   — one write per message exchanged
  #
  # cache / analytics / feedback / audit / knowledge — background tables.
  #   Read:  10 000 CU  — analytics dashboards / cache lookups
  #   Write: 10 000 CU  — bulk analytics events / cache population
  #
  # treat_missing_data = "missing" is correct for capacity metrics:
  # no data means no traffic, which is not a problem.
  dynamodb_alarms = {
    users = {
      table           = var.dynamodb_table_users
      read_threshold  = 10000
      write_threshold = 1000
    }
    conversations = {
      table           = var.dynamodb_table_conversations
      read_threshold  = 10000
      write_threshold = 1000
    }
    messages = {
      table           = var.dynamodb_table_messages
      read_threshold  = 10000
      write_threshold = 1000
    }
    cache = {
      table           = var.dynamodb_table_cache
      read_threshold  = 10000
      write_threshold = 10000
    }
    analytics = {
      table           = var.dynamodb_table_analytics
      read_threshold  = 10000
      write_threshold = 10000
    }
    feedback = {
      table           = var.dynamodb_table_feedback
      read_threshold  = 10000
      write_threshold = 10000
    }
    audit = {
      table           = var.dynamodb_table_audit
      read_threshold  = 10000
      write_threshold = 10000
    }
    knowledge = {
      table           = var.dynamodb_table_knowledge
      read_threshold  = 10000
      write_threshold = 10000
    }
  }

  # ── Human-readable table labels for alarm names ───────────────────────────
  dynamodb_labels = {
    users         = "Users"
    conversations = "Conversations"
    messages      = "Messages"
    cache         = "ResponseCache"
    analytics     = "Analytics"
    feedback      = "Feedback"
    audit         = "AuditLogs"
    knowledge     = "KnowledgeBase"
  }
}

# ─── Metric Filters ───────────────────────────────────────────────────────────
# Log groups are owned by the lambda module. Filters reference them by name.

resource "aws_cloudwatch_log_metric_filter" "errors" {
  for_each       = toset(var.lambda_function_names)
  name           = "${local.prefix}-${each.value}-error-filter"
  log_group_name = "/aws/lambda/${each.value}"
  pattern        = "{ $.level = \"error\" }"

  metric_transformation {
    name      = "ErrorCount"
    namespace = "AISSS/${var.environment}"
    value     = "1"
  }
}

resource "aws_cloudwatch_log_metric_filter" "cold_starts" {
  for_each       = toset(var.lambda_function_names)
  name           = "${local.prefix}-${each.value}-coldstart-filter"
  log_group_name = "/aws/lambda/${each.value}"
  pattern        = "{ $.message = \"Cold start detected\" }"

  metric_transformation {
    name      = "ColdStartCount"
    namespace = "AISSS/${var.environment}"
    value     = "1"
  }
}

# ─── Lambda — Error Alarms ────────────────────────────────────────────────────
# Threshold:          >5 errors in one 60-second period
# Evaluation periods: 2 consecutive periods must breach before firing.
#                     This prevents a single transient Bedrock timeout from
#                     waking someone up at 3 AM.
# treat_missing_data: notBreaching — no invocations = no problem.
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${local.prefix}-${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = var.lambda_error_evaluation_periods
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Lambda ${each.value} has >${var.lambda_error_threshold} errors in 1 minute for ${var.lambda_error_evaluation_periods} consecutive periods"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [var.sns_alerts_topic_arn]
  ok_actions          = [var.sns_alerts_topic_arn]
}

# ─── Lambda — Duration Alarms ─────────────────────────────────────────────────
# Threshold varies per function — see function_duration_thresholds local.
# chat-send:    30 000 ms — Bedrock cold starts can take 15-20 s legitimately.
# chat-process: 60 000 ms — SQS async consumer, 300 s timeout, more headroom.
# All others:   10 000 ms — DynamoDB/Cognito calls should complete well under 5 s.
# Evaluation periods: 3 — three consecutive slow minutes signal a real problem.
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${local.prefix}-${each.value}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  extended_statistic  = "p99"
  threshold           = local.function_duration_thresholds[each.value]
  alarm_description   = "Lambda ${each.value} p99 duration exceeds ${local.function_duration_thresholds[each.value]}ms"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── Lambda — Throttle Alarms ─────────────────────────────────────────────────
# Threshold: >10 throttles in 60 seconds.
# Throttles are always actionable — they mean requests are being dropped.
# evaluation_periods = 1: alert immediately on any throttle burst.
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${local.prefix}-${each.value}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "Lambda ${each.value} has >${var.lambda_throttle_threshold} throttles in 1 minute"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── API Gateway — 5xx Error Alarm ────────────────────────────────────────────
# Threshold: >10 5xx errors in 60 seconds.
# evaluation_periods = 1: 5xx errors are almost always actionable immediately.
resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name          = "${local.prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway has >10 5xx errors in 1 minute"
  treat_missing_data  = "notBreaching"
  dimensions          = { ApiId = var.api_gateway_id }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── API Gateway — Latency Alarm ──────────────────────────────────────────────
# Threshold: p99 > 5 000 ms sustained over 3 consecutive minutes.
# p99 latency at 5 s means 99% of requests are taking longer than 5 s —
# that is a severe degradation for an interactive chat application.
# evaluation_periods = 3 avoids alerting on isolated slow responses.
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.prefix}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 5000
  alarm_description   = "API Gateway p99 latency exceeds 5 seconds"
  treat_missing_data  = "notBreaching"
  dimensions          = { ApiId = var.api_gateway_id }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── SQS — DLQ Messages Alarm ────────────────────────────────────────────────
# Threshold: >0 messages visible in the DLQ.
# Any message reaching the DLQ means chat-process failed 3 consecutive times —
# this always warrants immediate investigation, hence evaluation_periods = 1.
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Messages found in the chat DLQ — processing failures detected"
  treat_missing_data  = "notBreaching"
  dimensions          = { QueueName = var.dlq_name }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── DynamoDB — Consumed Read Capacity Alarms ────────────────────────────────
# Threshold: see dynamodb_alarms local above for per-table rationale.
# period = 300 (5 min): capacity metrics are naturally bursty over short windows.
#   A 5-minute aggregation smooths out single-request spikes.
# evaluation_periods = 3 (15 min sustained): only alarm on sustained over-consumption,
#   not a single burst from a dashboard load or admin query.
# treat_missing_data = "missing": no data means no reads — not a problem.
resource "aws_cloudwatch_metric_alarm" "dynamodb_read" {
  for_each = local.dynamodb_alarms

  alarm_name          = "aisss-DynamoDB-${local.dynamodb_labels[each.key]}-ConsumedReadCapacityUnits"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = each.value.read_threshold
  treat_missing_data  = "missing"

  dimensions = {
    TableName = each.value.table
  }

  alarm_description = "Consumed read capacity for ${each.value.table} exceeded ${each.value.read_threshold} units over 5 min for 3 consecutive periods"
  alarm_actions     = [var.sns_alerts_topic_arn]
}

# ─── DynamoDB — Consumed Write Capacity Alarms ───────────────────────────────
# Same rationale as read alarms above. Write thresholds are lower for
# users/conversations/messages because write bursts on those tables indicate
# unexpected registration spikes or message floods worth investigating sooner.
resource "aws_cloudwatch_metric_alarm" "dynamodb_write" {
  for_each = local.dynamodb_alarms

  alarm_name          = "aisss-DynamoDB-${local.dynamodb_labels[each.key]}-ConsumedWriteCapacityUnits"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = each.value.write_threshold
  treat_missing_data  = "missing"

  dimensions = {
    TableName = each.value.table
  }

  alarm_description = "Consumed write capacity for ${each.value.table} exceeded ${each.value.write_threshold} units over 5 min for 3 consecutive periods"
  alarm_actions     = [var.sns_alerts_topic_arn]
}

# ─── CloudWatch Dashboard ─────────────────────────────────────────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # Row 1 — API Gateway overview
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6
        properties = {
          title  = "API Gateway — Requests & Errors"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiId", var.api_gateway_id, { label = "Requests" }],
            ["AWS/ApiGateway", "5XXError", "ApiId", var.api_gateway_id, { label = "5xx Errors", color = "#d62728" }],
            ["AWS/ApiGateway", "4XXError", "ApiId", var.api_gateway_id, { label = "4xx Errors", color = "#ff7f0e" }],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 0, width = 12, height = 6
        properties = {
          title   = "API Gateway — Latency (p99)"
          region  = var.aws_region
          period  = 300
          stat    = "p99"
          metrics = [["AWS/ApiGateway", "Latency", "ApiId", var.api_gateway_id]]
        }
      },
      # Row 2 — Lambda health
      {
        type = "metric", x = 0, y = 6, width = 12, height = 6
        properties = {
          title  = "Lambda — Errors"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [for fn in var.lambda_function_names :
            ["AWS/Lambda", "Errors", "FunctionName", fn, { label = fn }]
          ]
        }
      },
      {
        type = "metric", x = 12, y = 6, width = 12, height = 6
        properties = {
          title  = "Lambda — Duration (p99)"
          region = var.aws_region
          period = 300
          stat   = "p99"
          metrics = [for fn in var.lambda_function_names :
            ["AWS/Lambda", "Duration", "FunctionName", fn, { label = fn }]
          ]
        }
      },
      # Row 3 — Lambda throttles + SQS
      {
        type = "metric", x = 0, y = 12, width = 12, height = 6
        properties = {
          title  = "Lambda — Throttles"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [for fn in var.lambda_function_names :
            ["AWS/Lambda", "Throttles", "FunctionName", fn, { label = fn }]
          ]
        }
      },
      {
        type = "metric", x = 12, y = 12, width = 12, height = 6
        properties = {
          title  = "SQS — Chat Queue & DLQ"
          region = var.aws_region
          period = 300
          stat   = "Average"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.queue_name, { label = "Chat Queue" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.dlq_name, { label = "DLQ", color = "#d62728" }],
          ]
        }
      },
      # Row 4 — AI performance
      {
        type = "metric", x = 0, y = 18, width = 12, height = 6
        properties = {
          title  = "AI — Latency & Token Usage"
          region = var.aws_region
          period = 300
          stat   = "Average"
          metrics = [
            ["AISSS/AI", "Latency", "Environment", var.environment],
            ["AISSS/AI", "TokensUsed", "Environment", var.environment],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 18, width = 12, height = 6
        properties = {
          title  = "AI — Cache Hits vs AI Invocations"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AISSS/AI", "CacheHit", "Environment", var.environment, { label = "Cache Hits", color = "#2ca02c" }],
            ["AISSS/AI", "AIInvocation", "Environment", var.environment, { label = "AI Calls", color = "#9467bd" }],
          ]
        }
      },
      # Row 5 — DynamoDB capacity (core tables)
      {
        type = "metric", x = 0, y = 24, width = 12, height = 6
        properties = {
          title  = "DynamoDB — Read Capacity (core tables)"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_users, { label = "Users" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_conversations, { label = "Conversations" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_messages, { label = "Messages" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_cache, { label = "Cache" }],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 24, width = 12, height = 6
        properties = {
          title  = "DynamoDB — Write Capacity (core tables)"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_users, { label = "Users" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_conversations, { label = "Conversations" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_messages, { label = "Messages" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_cache, { label = "Cache" }],
          ]
        }
      },
      # Row 6 — DynamoDB capacity (operational tables)
      {
        type = "metric", x = 0, y = 30, width = 12, height = 6
        properties = {
          title  = "DynamoDB — Read Capacity (operational tables)"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_analytics, { label = "Analytics" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_feedback, { label = "Feedback" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_audit, { label = "Audit" }],
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", var.dynamodb_table_knowledge, { label = "Knowledge" }],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 30, width = 12, height = 6
        properties = {
          title  = "DynamoDB — Write Capacity (operational tables)"
          region = var.aws_region
          period = 300
          stat   = "Sum"
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_analytics, { label = "Analytics" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_feedback, { label = "Feedback" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_audit, { label = "Audit" }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", var.dynamodb_table_knowledge, { label = "Knowledge" }],
          ]
        }
      },
    ]
  })
}
