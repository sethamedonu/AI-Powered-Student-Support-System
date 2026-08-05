variable "environment" { type = string }
variable "app_name" { type = string }
variable "aws_region" { type = string }
variable "sns_alerts_topic_arn" { type = string }
variable "api_gateway_id" { type = string }
variable "lambda_function_names" { type = list(string) }
variable "queue_name" { type = string }
variable "dlq_name" { type = string }

variable "log_retention_days" {
  type    = number
  default = 30
}

# ─── Lambda alarm thresholds ─────────────────────────────────────────────────
variable "lambda_error_threshold" {
  type        = number
  default     = 5
  description = "Number of errors in one period before alarming (default functions)"
}

variable "lambda_error_evaluation_periods" {
  type        = number
  default     = 2
  description = "Consecutive periods with errors before firing. 2 reduces false positives."
}

variable "lambda_throttle_threshold" {
  type        = number
  default     = 10
  description = "Number of throttles in one period before alarming"
}

variable "lambda_duration_threshold_ms" {
  type        = number
  default     = 10000
  description = "p99 duration alarm threshold in ms for standard functions (auth, admin, etc.)"
}

variable "lambda_chat_duration_threshold_ms" {
  type        = number
  default     = 30000
  description = "p99 duration alarm threshold in ms for chat-send (Bedrock calls take 5-15s normally)"
}

variable "lambda_chat_process_duration_threshold_ms" {
  type        = number
  default     = 60000
  description = "p99 duration alarm threshold in ms for chat-process (SQS consumer, 300s timeout)"
}

# ─── DynamoDB table names ─────────────────────────────────────────────────────
variable "dynamodb_table_users" { type = string }
variable "dynamodb_table_conversations" { type = string }
variable "dynamodb_table_messages" { type = string }
variable "dynamodb_table_cache" { type = string }
variable "dynamodb_table_analytics" { type = string }
variable "dynamodb_table_feedback" { type = string }
variable "dynamodb_table_audit" { type = string }
variable "dynamodb_table_knowledge" { type = string }
