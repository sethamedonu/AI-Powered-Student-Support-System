locals {
  prefix      = "${var.app_name}-${var.environment}"
  branch_name = var.environment == "prod" ? "main" : var.environment
}

resource "aws_amplify_app" "main" {
  name         = "${local.prefix}-frontend"
  repository   = var.github_repository
  access_token = var.github_access_token

  # WEB_COMPUTE enables the Node.js SSR runtime (required for Next.js)
  platform = "WEB_COMPUTE"

  enable_branch_auto_build    = true
  enable_branch_auto_deletion = true

  auto_branch_creation_config {
    enable_auto_build           = true
    enable_pull_request_preview = var.environment != "prod"
    framework                   = "Next.js - SSR"
    stage                       = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
  }

  auto_branch_creation_patterns = [
    var.environment == "prod" ? "main" : "${var.environment}*",
    "feature/*",
  ]

  # Build config lives in amplify.yml at the repo root.
  # Amplify picks that file up automatically — no build_spec override needed.

  environment_variables = var.environment_variables

  tags = {
    Name = "${local.prefix}-frontend"
  }
}

resource "aws_amplify_branch" "main" {
  app_id       = aws_amplify_app.main.id
  branch_name  = local.branch_name
  display_name = local.branch_name

  framework = "Next.js - SSR"
  stage     = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  enable_auto_build           = true
  enable_pull_request_preview = var.environment != "prod"

  environment_variables = merge(var.environment_variables, {
    NEXT_PUBLIC_APP_ORIGIN = "https://${local.branch_name}.${aws_amplify_app.main.default_domain}"
  })

  tags = {
    Name = "${local.prefix}-branch-${local.branch_name}"
  }
}
