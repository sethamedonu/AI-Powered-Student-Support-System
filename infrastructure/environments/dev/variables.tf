variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "app_name" {
  type    = string
  default = "aisss"
}

variable "ses_from_email" {
  type = string
}

variable "alert_email" {
  type = string
}

variable "cognito_callback_urls" {
  type    = list(string)
  default = ["http://localhost:5173/auth/callback"]
}

variable "cognito_logout_urls" {
  type    = list(string)
  default = ["http://localhost:5173/auth/logout"]
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["http://localhost:5173"]
}

variable "bedrock_guardrail_id" {
  type    = string
  default = ""
}
