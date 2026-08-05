output "dashboard_name" {
  value = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  value = "https://console.aws.amazon.com/cloudwatch/home#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "log_group_names" {
  value = [for fn in var.lambda_function_names : "/aws/lambda/${fn}"]
}
