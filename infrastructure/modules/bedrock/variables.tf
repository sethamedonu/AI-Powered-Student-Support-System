variable "environment" {
  type        = string
  description = "Deployment environment (dev / staging / prod)"
}

variable "app_name" {
  type        = string
  description = "Application name prefix"
}

variable "s3_vectors_index_arn" {
  type        = string
  default     = ""
  description = <<-EOT
    ARN of the S3 Vectors index used as the Knowledge Base vector store.
    S3 Vectors and the Bedrock KB with S3_VECTORS storage cannot yet be
    created by Terraform. Create them via the AWS CLI commands documented
    in bedrock/main.tf, then set this variable so the IAM policy is attached.
  EOT
}

variable "bedrock_knowledge_base_id" {
  type        = string
  default     = ""
  description = "Bedrock Knowledge Base ID — set after manually creating the KB via CLI"
}

variable "bedrock_knowledge_data_source_id" {
  type        = string
  default     = ""
  description = "Bedrock Data Source ID — set after manually creating the data source via CLI"
}

variable "lambda_execution_role_arn" {
  type        = string
  description = "ARN of the Lambda execution role — added to the OpenSearch Serverless data access policy"
}
