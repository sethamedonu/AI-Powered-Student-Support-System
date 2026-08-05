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
  default     = "arn:aws:s3vectors:us-east-1:314175685812:bucket/aisss-dev-kb-vectors/index/aisss-dev-kb-index"
  description = "ARN of the S3 Vectors index used by Bedrock Knowledge Base"
}

variable "bedrock_knowledge_base_id" {
  type        = string
  default     = "S5JEZ4X9IG"
  description = "Bedrock Knowledge Base ID (created via CLI — S3 Vectors storage)"
}

variable "bedrock_knowledge_data_source_id" {
  type        = string
  default     = "SYE8DOK5AS"
  description = "Bedrock Knowledge Base Data Source ID"
}
