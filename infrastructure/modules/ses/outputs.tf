output "email_identity_arn" {
  value = aws_ses_email_identity.from.arn
}

output "configuration_set_name" {
  value = aws_ses_configuration_set.main.name
}
