output "table_users_name" {
  value = aws_dynamodb_table.users.name
}

output "table_users_arn" {
  value = aws_dynamodb_table.users.arn
}

output "table_conversations_name" {
  value = aws_dynamodb_table.conversations.name
}

output "table_conversations_arn" {
  value = aws_dynamodb_table.conversations.arn
}

output "table_messages_name" {
  value = aws_dynamodb_table.messages.name
}

output "table_messages_arn" {
  value = aws_dynamodb_table.messages.arn
}

output "table_cache_name" {
  value = aws_dynamodb_table.response_cache.name
}

output "table_cache_arn" {
  value = aws_dynamodb_table.response_cache.arn
}

output "table_analytics_name" {
  value = aws_dynamodb_table.analytics.name
}

output "table_analytics_arn" {
  value = aws_dynamodb_table.analytics.arn
}

output "table_feedback_name" {
  value = aws_dynamodb_table.feedback.name
}

output "table_feedback_arn" {
  value = aws_dynamodb_table.feedback.arn
}

output "table_audit_name" {
  value = aws_dynamodb_table.audit_logs.name
}

output "table_audit_arn" {
  value = aws_dynamodb_table.audit_logs.arn
}

output "table_knowledge_name" {
  value = aws_dynamodb_table.knowledge_base.name
}

output "table_knowledge_arn" {
  value = aws_dynamodb_table.knowledge_base.arn
}

output "all_table_arns" {
  description = "List of all DynamoDB table ARNs for IAM policies"
  value = [
    aws_dynamodb_table.users.arn,
    aws_dynamodb_table.conversations.arn,
    aws_dynamodb_table.messages.arn,
    aws_dynamodb_table.response_cache.arn,
    aws_dynamodb_table.analytics.arn,
    aws_dynamodb_table.feedback.arn,
    aws_dynamodb_table.audit_logs.arn,
    aws_dynamodb_table.knowledge_base.arn,
  ]
}
