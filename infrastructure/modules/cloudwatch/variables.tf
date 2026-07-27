variable "environment" { type = string }
variable "app_name" { type = string }
variable "sns_alerts_topic_arn" { type = string }
variable "api_gateway_id" { type = string }
variable "lambda_function_names" { type = list(string) }
