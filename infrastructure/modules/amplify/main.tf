locals {
  prefix = "${var.app_name}-${var.environment}"
}

resource "aws_amplify_app" "main" {
  name         = "${local.prefix}-frontend"
  repository   = var.github_repository
  access_token = var.github_access_token

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
      cache:
        paths:
          - frontend/node_modules/**/*
  EOT

  environment_variables = var.environment_variables

  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  tags = {
    Name = "${local.prefix}-frontend"
  }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.environment == "prod" ? "main" : var.environment

  enable_auto_build           = true
  enable_pull_request_preview = var.environment != "prod"

  tags = {
    Name = "${local.prefix}-branch-${var.environment}"
  }
}
