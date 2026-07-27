locals {
  prefix = "${var.app_name}-${var.environment}"
}

data "aws_route53_zone" "main" {
  name         = var.domain
  private_zone = false
}

resource "aws_route53_record" "frontend" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.environment == "prod" ? var.domain : "${var.environment}.${var.domain}"
  type    = "CNAME"
  ttl     = 300
  records = [var.amplify_app_domain]
}
