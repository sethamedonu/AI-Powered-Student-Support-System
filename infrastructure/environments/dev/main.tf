terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {
    bucket         = "aisss-terraform-state-646966486144"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "aisss-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "AI-Powered-Student-Support-System"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "sethamedonu"
    }
  }
}

module "iam" {
  source      = "../../modules/iam"
  environment = var.environment
  app_name    = var.app_name
}

module "dynamodb" {
  source      = "../../modules/dynamodb"
  environment = var.environment
  app_name    = var.app_name
}

module "cognito" {
  source         = "../../modules/cognito"
  environment    = var.environment
  app_name       = var.app_name
  ses_from_email = var.ses_from_email
  callback_urls  = var.cognito_callback_urls
  logout_urls    = var.cognito_logout_urls
}

module "sqs" {
  source      = "../../modules/sqs"
  environment = var.environment
  app_name    = var.app_name
}

module "sns" {
  source      = "../../modules/sns"
  environment = var.environment
  app_name    = var.app_name
  alert_email = var.alert_email
}

module "ses" {
  source      = "../../modules/ses"
  environment = var.environment
  app_name    = var.app_name
  domain      = var.ses_from_email
  from_email  = var.ses_from_email
}

module "lambda" {
  source                       = "../../modules/lambda"
  environment                  = var.environment
  app_name                     = var.app_name
  aws_region                   = var.aws_region
  lambda_execution_role_arn    = module.iam.lambda_execution_role_arn
  dynamodb_table_users         = module.dynamodb.table_users_name
  dynamodb_table_conversations = module.dynamodb.table_conversations_name
  dynamodb_table_messages      = module.dynamodb.table_messages_name
  dynamodb_table_cache         = module.dynamodb.table_cache_name
  dynamodb_table_analytics     = module.dynamodb.table_analytics_name
  dynamodb_table_feedback      = module.dynamodb.table_feedback_name
  dynamodb_table_audit         = module.dynamodb.table_audit_name
  dynamodb_table_knowledge     = module.dynamodb.table_knowledge_name
  cognito_user_pool_id         = module.cognito.user_pool_id
  cognito_client_id            = module.cognito.user_pool_client_id
  sqs_chat_queue_url           = module.sqs.chat_queue_url
  sqs_chat_queue_arn           = module.sqs.chat_queue_arn
  sns_alerts_topic_arn         = module.sns.alerts_topic_arn
  ses_from_email               = var.ses_from_email
  bedrock_region               = var.aws_region
  bedrock_guardrail_id         = var.bedrock_guardrail_id
  cors_allowed_origins         = var.cors_allowed_origins
}

module "api_gateway" {
  source                = "../../modules/api-gateway"
  environment           = var.environment
  app_name              = var.app_name
  aws_region            = var.aws_region
  cognito_user_pool_arn = module.cognito.user_pool_arn
  lambda_functions      = module.lambda.function_arns
  cors_allowed_origins  = var.cors_allowed_origins
}

module "cloudwatch" {
  source                = "../../modules/cloudwatch"
  environment           = var.environment
  app_name              = var.app_name
  aws_region            = var.aws_region
  sns_alerts_topic_arn  = module.sns.alerts_topic_arn
  api_gateway_id        = module.api_gateway.rest_api_id
  lambda_function_names = module.lambda.function_names
  queue_name            = module.sqs.chat_queue_name
  dlq_name              = module.sqs.chat_dlq_name
}

module "amplify" {
  source              = "../../modules/amplify"
  environment         = var.environment
  app_name            = var.app_name
  github_repository   = var.github_repository
  github_access_token = var.github_access_token
  domain              = var.domain
  acm_certificate_arn = ""
  environment_variables = {
    NEXT_PUBLIC_API_URL              = module.api_gateway.invoke_url
    NEXT_PUBLIC_COGNITO_REGION       = var.aws_region
    NEXT_PUBLIC_COGNITO_USER_POOL_ID = module.cognito.user_pool_id
    NEXT_PUBLIC_COGNITO_CLIENT_ID    = module.cognito.user_pool_client_id
    NEXT_PUBLIC_ENVIRONMENT          = var.environment
  }
}
