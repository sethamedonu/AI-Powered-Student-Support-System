output "certificate_arn" {
  value      = aws_acm_certificate_validation.main.certificate_arn
  depends_on = [aws_acm_certificate_validation.main]
}

output "domain_validation_options" {
  value = aws_acm_certificate.main.domain_validation_options
}
