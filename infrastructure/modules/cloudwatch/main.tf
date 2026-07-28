locals {
  prefix = "${var.app_name}-${var.environment}"
}

# ─── Log Groups ───────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "lambda" {
  for_each          = toset(var.lambda_function_names)
  name              = "/aws/lambda/${each.value}"
  retention_in_days = var.log_retention_days

  tags = { Environment = var.environment }
}

# ─── Metric Filters ───────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_metric_filter" "errors" {
  for_each       = toset(var.lambda_function_names)
  name           = "${local.prefix}-${each.value}-error-filter"
  log_group_name = "/aws/lambda/${each.value}"
  pattern        = "{ $.level = \"error\" }"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "AISSS/${var.environment}"
    value         = "1"
    default_value = "0"
    dimensions    = { FunctionName = each.value }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

resource "aws_cloudwatch_log_metric_filter" "cold_starts" {
  for_each       = toset(var.lambda_function_names)
  name           = "${local.prefix}-${each.value}-coldstart-filter"
  log_group_name = "/aws/lambda/${each.value}"
  pattern        = "{ $.message = \"Cold start detected\" }"

  metric_transformation {
    name          = "ColdStartCount"
    namespace     = "AISSS/${var.environment}"
    value         = "1"
    default_value = "0"
    dimensions    = { FunctionName = each.value }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}

# ─── Lambda Error Alarms ──────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${local.prefix}-${each.value}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda ${each.value} has >5 errors in 1 minute"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [var.sns_alerts_topic_arn]
  ok_actions          = [var.sns_alerts_topic_arn]
}

# ─── Lambda Duration Alarms ───────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${local.prefix}-${each.value}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 60
  extended_statistic  = "p99"
  threshold           = var.lambda_duration_threshold_ms
  alarm_description   = "Lambda ${each.value} p99 duration exceeds ${var.lambda_duration_threshold_ms}ms"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── Lambda Throttle Alarms ───────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${local.prefix}-${each.value}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda ${each.value} has >10 throttles in 1 minute"
  treat_missing_data  = "notBreaching"
  dimensions          = { FunctionName = each.value }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── API Gateway Alarms ───────────────────────────────────────────────────────
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

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.prefix}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "p99"
  threshold           = 5000
  alarm_description   = "API Gateway p99 latency exceeds 5 seconds"
  treat_missing_data  = "notBreaching"
  dimensions          = { ApiId = var.api_gateway_id }
  alarm_actions       = [var.sns_alerts_topic_arn]
}

# ─── SQS DLQ Alarm ───────────────────────────────────────────────────────────
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

# ─── CloudWatch Dashboard ─────────────────────────────────────────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric", x = 0, y = 0, width = 12, height = 6
        properties = {
          title   = "API Gateway — Requests & Errors"
          period  = 300
          stat    = "Sum"
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
          period  = 300
          stat    = "p99"
          metrics = [["AWS/ApiGateway", "Latency", "ApiId", var.api_gateway_id]]
        }
      },
      {
        type = "metric", x = 0, y = 6, width = 12, height = 6
        properties = {
          title   = "Lambda — Errors"
          period  = 300
          stat    = "Sum"
          metrics = [for fn in var.lambda_function_names :
            ["AWS/Lambda", "Errors", "FunctionName", fn, { label = fn }]
          ]
        }
      },
      {
        type = "metric", x = 12, y = 6, width = 12, height = 6
        properties = {
          title   = "Lambda — Duration (p99)"
          period  = 300
          stat    = "p99"
          metrics = [for fn in var.lambda_function_names :
            ["AWS/Lambda", "Duration", "FunctionName", fn, { label = fn }]
          ]
        }
      },
      {
        type = "metric", x = 0, y = 12, width = 12, height = 6
        properties = {
          title   = "Lambda — Throttles"
          period  = 300
          stat    = "Sum"
          metrics = [for fn in var.lambda_function_names :
            ["AWS/Lambda", "Throttles", "FunctionName", fn, { label = fn }]
          ]
        }
      },
      {
        type = "metric", x = 12, y = 12, width = 12, height = 6
        properties = {
          title   = "SQS — Chat Queue & DLQ"
          period  = 300
          stat    = "Average"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.queue_name, { label = "Chat Queue" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", var.dlq_name, { label = "DLQ", color = "#d62728" }],
          ]
        }
      },
      {
        type = "metric", x = 0, y = 18, width = 12, height = 6
        properties = {
          title   = "AI — Latency & Token Usage"
          period  = 300
          stat    = "Average"
          metrics = [
            ["AISSS/AI", "Latency", "Environment", var.environment],
            ["AISSS/AI", "TokensUsed", "Environment", var.environment],
          ]
        }
      },
      {
        type = "metric", x = 12, y = 18, width = 12, height = 6
        properties = {
          title   = "AI — Cache Hits vs AI Invocations"
          period  = 300
          stat    = "Sum"
          metrics = [
            ["AISSS/AI", "CacheHit", "Environment", var.environment, { label = "Cache Hits", color = "#2ca02c" }],
            ["AISSS/AI", "AIInvocation", "Environment", var.environment, { label = "AI Calls", color = "#9467bd" }],
          ]
        }
      },
    ]
  })
}
