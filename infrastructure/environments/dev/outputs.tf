output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.invoke_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.cognito.user_pool_id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = module.cognito.user_pool_client_id
}

output "dynamodb_table_names" {
  description = "All DynamoDB table names"
  value = {
    users         = module.dynamodb.table_users_name
    conversations = module.dynamodb.table_conversations_name
    messages      = module.dynamodb.table_messages_name
    cache         = module.dynamodb.table_cache_name
    analytics     = module.dynamodb.table_analytics_name
    feedback      = module.dynamodb.table_feedback_name
    audit         = module.dynamodb.table_audit_name
    knowledge     = module.dynamodb.table_knowledge_name
  }
}

output "sqs_chat_queue_url" {
  description = "SQS chat processing queue URL"
  value       = module.sqs.chat_queue_url
}

output "sns_alerts_topic_arn" {
  description = "SNS alerts topic ARN"
  value       = module.sns.alerts_topic_arn
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain (manually created)"
  value       = "https://d1056g6ybpps7o.cloudfront.net"
}

output "cloudfront_arn" {
  description = "CloudFront distribution ARN"
  value       = "arn:aws:cloudfront::646966486144:distribution/E1PTK0MXNGRETB"
}
