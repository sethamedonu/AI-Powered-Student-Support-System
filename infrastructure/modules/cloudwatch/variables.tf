variable "environment" { type = string }
variable "app_name" { type = string }
variable "sns_alerts_topic_arn" { type = string }
variable "api_gateway_id" { type = string }
variable "lambda_function_names" { type = list(string) }
variable "queue_name" { type = string }
variable "dlq_name" { type = string }

variable "log_retention_days" {
  type    = number
  default = 30
}

variable "lambda_duration_threshold_ms" {
  type    = number
  default = 10000
  description = "p99 Lambda duration alarm threshold in milliseconds"
}
