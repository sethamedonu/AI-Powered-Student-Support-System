output "guardrail_id" {
  description = "Bedrock guardrail ID"
  value       = aws_bedrock_guardrail.main.guardrail_id
}

output "guardrail_arn" {
  description = "Full ARN of the guardrail"
  value       = aws_bedrock_guardrail.main.guardrail_arn
}

output "guardrail_version" {
  description = "Published version number"
  value       = aws_bedrock_guardrail_version.v1.version
}

output "knowledge_docs_bucket" {
  description = "S3 bucket name where admins upload PDFs for the Knowledge Base"
  value       = aws_s3_bucket.knowledge_docs.bucket
}

output "knowledge_docs_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.knowledge_docs.arn
}

output "knowledge_base_role_arn" {
  description = "IAM role ARN for the Bedrock Knowledge Base (needed for manual KB creation)"
  value       = aws_iam_role.bedrock_kb.arn
}

# These are provided via variables once the KB is manually created via CLI
output "knowledge_base_id" {
  description = "Bedrock Knowledge Base ID (set via var.bedrock_knowledge_base_id after manual creation)"
  value       = var.bedrock_knowledge_base_id
}

output "knowledge_data_source_id" {
  description = "Bedrock Data Source ID (set via var.bedrock_knowledge_data_source_id after manual creation)"
  value       = var.bedrock_knowledge_data_source_id
}

output "opensearch_collection_arn" {
  description = "OpenSearch Serverless collection ARN used as KB vector store"
  value       = "arn:aws:aoss:us-east-1:314175685812:collection/g7i64ouqqxc3h6a7fsm9"
}

output "opensearch_collection_endpoint" {
  description = "OpenSearch Serverless collection endpoint"
  value       = "https://g7i64ouqqxc3h6a7fsm9.us-east-1.aoss.amazonaws.com"
}
