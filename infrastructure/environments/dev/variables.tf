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
  default = ["https://dev.dwfkamikpgffo.amplifyapp.com/auth/callback", "http://localhost:3000/auth/callback"]
}

variable "cognito_logout_urls" {
  type    = list(string)
  default = ["https://dev.dwfkamikpgffo.amplifyapp.com/auth/logout", "http://localhost:3000/auth/logout"]
}

variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://dev.dwfkamikpgffo.amplifyapp.com", "http://localhost:3000"]
}

variable "github_repository" {
  type    = string
  default = "https://github.com/sethamedonu/AI-Powered-Student-Support-System"
}

variable "github_access_token" {
  type      = string
  sensitive = true
}

variable "domain" {
  type    = string
  default = ""
}

variable "s3_vectors_index_arn" {
  type        = string
  default     = ""
  description = "ARN of the S3 Vectors index (no longer used — migrated to OpenSearch Serverless)"
}

variable "bedrock_knowledge_base_id" {
  type        = string
  default     = "86HYJUEMJL"
  description = "Bedrock Knowledge Base ID — OpenSearch Serverless backend (collection aisss-dev-kb / g7i64ouqqxc3h6a7fsm9)"
}

variable "bedrock_knowledge_data_source_id" {
  type        = string
  default     = "OTSDN45AJ7"
  description = "Bedrock Knowledge Base Data Source ID — S3 bucket aisss-dev-knowledge-docs-314175685812"
}
