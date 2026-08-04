output "guardrail_id" {
  description = "Bedrock guardrail ID — passed to Lambda BEDROCK_GUARDRAIL_ID env var"
  value       = aws_bedrock_guardrail.main.guardrail_id
}

output "guardrail_arn" {
  description = "Full ARN of the guardrail"
  value       = aws_bedrock_guardrail.main.guardrail_arn
}

output "guardrail_version" {
  description = "Published version number pinned by Lambda"
  value       = aws_bedrock_guardrail_version.v1.version
}
