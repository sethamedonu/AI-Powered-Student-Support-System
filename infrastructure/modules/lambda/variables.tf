variable "environment" { type = string }
variable "app_name" { type = string }
variable "aws_region" { type = string }
variable "lambda_execution_role_arn" { type = string }
variable "dynamodb_table_users" { type = string }
variable "dynamodb_table_conversations" { type = string }
variable "dynamodb_table_messages" { type = string }
variable "dynamodb_table_cache" { type = string }
variable "dynamodb_table_analytics" { type = string }
variable "dynamodb_table_feedback" { type = string }
variable "dynamodb_table_audit" { type = string }
variable "dynamodb_table_knowledge" { type = string }
variable "cognito_user_pool_id" { type = string }
variable "cognito_client_id" { type = string }
variable "sqs_chat_queue_url" { type = string }
variable "sqs_chat_queue_arn" { type = string }
variable "sns_alerts_topic_arn" { type = string }
variable "ses_from_email" { type = string }
variable "bedrock_region" { type = string }
variable "bedrock_model_routine" {
  type    = string
  default = "us.amazon.nova-lite-v1:0"
}
variable "bedrock_model_complex" {
  type    = string
  default = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"
}
variable "bedrock_guardrail_id" { type = string }
variable "bedrock_guardrail_version" { type = string }
variable "bedrock_knowledge_base_id" { type = string }
variable "bedrock_knowledge_data_source_id" { type = string }
variable "knowledge_docs_bucket" { type = string }
variable "cors_allowed_origins" {
  type    = list(string)
  default = ["*"]
}
