variable "environment" { type = string }
variable "app_name" { type = string }
variable "aws_region" { type = string }
variable "cognito_user_pool_arn" { type = string }
variable "lambda_functions" { type = map(string) }
variable "cors_allowed_origins" { type = list(string) }
