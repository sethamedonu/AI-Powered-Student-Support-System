locals {
  prefix      = "${var.app_name}-${var.environment}"
  branch_name = var.environment == "prod" ? "main" : var.environment
}

resource "aws_amplify_app" "main" {
  name         = "${local.prefix}-frontend"
  repository   = var.github_repository
  access_token = var.github_access_token
  platform     = "WEB"

  enable_branch_auto_build       = true
  enable_branch_auto_deletion    = true

  auto_branch_creation_config {
    enable_auto_build           = true
    enable_pull_request_preview = var.environment != "prod"
    framework                   = "Qwik"
    stage                       = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"
  }

  auto_branch_creation_patterns = [
    var.environment == "prod" ? "main" : "${var.environment}*",
    "feature/*",
  ]

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - nvm install 22
            - nvm use 22
            - npm ci
        build:
          commands:
            - npm run build:frontend
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  environment_variables = var.environment_variables

  # SPA routing — send all non-asset requests to index.html
  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  tags = {
    Name = "${local.prefix}-frontend"
  }
}

resource "aws_amplify_branch" "main" {
  app_id       = aws_amplify_app.main.id
  branch_name  = local.branch_name
  display_name = local.branch_name

  framework = "Qwik"
  stage     = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  enable_auto_build           = true
  enable_pull_request_preview = var.environment != "prod"

  environment_variables = var.environment_variables

  tags = {
    Name = "${local.prefix}-branch-${local.branch_name}"
  }
}
