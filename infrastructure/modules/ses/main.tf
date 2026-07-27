locals {
  prefix = "${var.app_name}-${var.environment}"
}

resource "aws_ses_email_identity" "from" {
  email = var.from_email
}

resource "aws_ses_configuration_set" "main" {
  name = "${local.prefix}-config-set"

  delivery_options {
    tls_policy = "Require"
  }
}
