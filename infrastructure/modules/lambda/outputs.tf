output "function_arns" {
  description = "Map of function name to ARN"
  value       = { for k, v in aws_lambda_function.functions : k => v.arn }
}

output "function_names" {
  description = "List of all Lambda function names"
  value       = [for k, v in aws_lambda_function.functions : v.function_name]
}

output "function_invoke_arns" {
  description = "Map of function name to invoke ARN (for API Gateway)"
  value       = { for k, v in aws_lambda_function.functions : k => v.invoke_arn }
}
