output "chat_queue_url" {
  value = aws_sqs_queue.chat_queue.url
}

output "chat_queue_arn" {
  value = aws_sqs_queue.chat_queue.arn
}

output "chat_queue_name" {
  value = aws_sqs_queue.chat_queue.name
}

output "chat_dlq_url" {
  value = aws_sqs_queue.chat_dlq.url
}

output "chat_dlq_arn" {
  value = aws_sqs_queue.chat_dlq.arn
}

output "chat_dlq_name" {
  value = aws_sqs_queue.chat_dlq.name
}
