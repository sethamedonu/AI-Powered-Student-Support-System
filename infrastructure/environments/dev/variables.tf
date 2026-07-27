variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "aisss"
}

variable "domain" {
  description = "Root domain name for the application"
  type        = string
}

variable "ses_from_email" {
  description = "Verified SES email address used as sender"
  type        = string
}

variable "alert_email" {
  description = "Email address to receive SNS infrastructure alerts"
  type        = string
}

variable "cognito_callback_urls" {
  description = "List of allowed callback URLs for Cognito OAuth"
  type        = list(string)
  default     = ["http://localhost:5173/auth/callback"]
}

variable "cognito_logout_urls" {
  description = "List of allowed logout URLs for Cognito OAuth"
  type        = list(string)
  default     = ["http://localhost:5173/auth/logout"]
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins for API Gateway"
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "github_repository" {
  description = "GitHub repository URL for Amplify CI/CD (e.g. https://github.com/owner/repo)"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify to access the repository"
  type        = string
  sensitive   = true
}

variable "bedrock_guardrail_id" {
  description = "Amazon Bedrock Guardrail ID for content filtering"
  type        = string
  default     = ""
}
