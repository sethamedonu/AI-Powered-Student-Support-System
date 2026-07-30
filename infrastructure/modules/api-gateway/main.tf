locals {
  prefix = "${var.app_name}-${var.environment}"
}

# ─── CloudWatch Logs Role for API Gateway ────────────────────────────────────
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${local.prefix}-apigw-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "apigateway.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# ─── REST API ─────────────────────────────────────────────────────────────────
resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.prefix}-api"
  description = "AI-Powered Student Support System REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${local.prefix}-api"
  }
}

# ─── Cognito Authorizer ───────────────────────────────────────────────────────
resource "aws_api_gateway_authorizer" "cognito" {
  name            = "${local.prefix}-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.main.id
  type            = "COGNITO_USER_POOLS"
  identity_source = "method.request.header.Authorization"
  provider_arns   = [var.cognito_user_pool_arn]
}

# ─── Gateway Responses (CORS on 4xx/5xx) ─────────────────────────────────────
resource "aws_api_gateway_gateway_response" "default_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origins[0]}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'${var.cors_allowed_origins[0]}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization,X-Amz-Date,X-Api-Key'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
  }
}

# ─── API Resources & Methods ──────────────────────────────────────────────────
module "route_health" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_rest_api.main.root_resource_id
  path_part     = "health"
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["health"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_auth_register" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.auth.id
  path_part     = "register"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["auth-register"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_auth_login" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.auth.id
  path_part     = "login"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["auth-login"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_auth_verify" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.auth.id
  path_part     = "verify"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["auth-verify"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_auth_forgot_password" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.auth.id
  path_part     = "forgot-password"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["auth-forgot-password"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_auth_reset_password" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.auth.id
  path_part     = "reset-password"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["auth-reset-password"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_auth_refresh" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.auth.id
  path_part     = "refresh"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["auth-refresh"]
  aws_region    = var.aws_region
  authorizer_id = ""
  require_auth  = false
}

module "route_chat_message" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.chat.id
  path_part     = "message"
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["chat-send"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
}

module "route_conversations_list" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.conversations.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["conversations-list"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

module "route_feedback_submit" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.feedback.id
  path_part     = ""
  http_method   = "POST"
  lambda_arn    = var.lambda_functions["feedback-submit"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

module "route_analytics_get" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.analytics.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["analytics-get"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

# ─── Admin routes ─────────────────────────────────────────────────────────────
resource "aws_api_gateway_resource" "admin_stats" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "stats"
}

resource "aws_api_gateway_resource" "admin_users" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "admin_feedback" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "feedback"
}

resource "aws_api_gateway_resource" "admin_analytics" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "analytics"
}

module "route_admin_stats" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.admin_stats.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["admin-stats"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

module "route_admin_users" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.admin_users.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["admin-users-list"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

module "route_admin_feedback" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.admin_feedback.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["admin-feedback-list"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

module "route_admin_analytics" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.admin_analytics.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["admin-analytics"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

resource "aws_api_gateway_resource" "conversation_id" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.conversations.id
  path_part   = "{conversationId}"
}

module "route_conversations_get" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.conversation_id.id
  path_part     = ""
  http_method   = "GET"
  lambda_arn    = var.lambda_functions["conversations-get"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

module "route_conversations_delete" {
  source        = "./routes"
  rest_api_id   = aws_api_gateway_rest_api.main.id
  parent_id     = aws_api_gateway_resource.conversation_id.id
  path_part     = ""
  http_method   = "DELETE"
  lambda_arn    = var.lambda_functions["conversations-delete"]
  aws_region    = var.aws_region
  authorizer_id = aws_api_gateway_authorizer.cognito.id
  require_auth  = true
  use_parent    = true
}

# ─── Parent Resources ─────────────────────────────────────────────────────────
resource "aws_api_gateway_resource" "auth" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "auth"
}

resource "aws_api_gateway_resource" "chat" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "chat"
}

resource "aws_api_gateway_resource" "conversations" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "conversations"
}

resource "aws_api_gateway_resource" "feedback" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "feedback"
}

resource "aws_api_gateway_resource" "analytics" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "analytics"
}

resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "admin"
}

# ─── Deployment & Stage ───────────────────────────────────────────────────────
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    module.route_health,
    module.route_auth_register,
    module.route_auth_login,
    module.route_auth_verify,
    module.route_auth_forgot_password,
    module.route_auth_reset_password,
    module.route_auth_refresh,
    module.route_chat_message,
    module.route_conversations_list,
    module.route_feedback_submit,
    module.route_analytics_get,
    module.route_admin_stats,
    module.route_admin_users,
    module.route_admin_feedback,
    module.route_admin_analytics,
    module.route_conversations_get,
    module.route_conversations_delete,
  ]
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      errorMessage   = "$context.error.message"
    })
  }

  depends_on = [aws_api_gateway_account.main]

  tags = {
    Name = "${local.prefix}-api-stage"
  }
}

resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = false
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/api-gateway/${local.prefix}"
  retention_in_days = 14
}
