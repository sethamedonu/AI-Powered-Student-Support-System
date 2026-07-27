locals {
  prefix = "${var.app_name}-${var.environment}"
}

# ─── Users Table ──────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "users" {
  name         = "${local.prefix}-users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "role"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "role-index"
    hash_key        = "role"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${local.prefix}-users"
  }
}

# ─── Conversations Table ──────────────────────────────────────────────────────
resource "aws_dynamodb_table" "conversations" {
  name         = "${local.prefix}-conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "conversationId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "conversationId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "conversationId-index"
    hash_key        = "conversationId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "${local.prefix}-conversations"
  }
}

# ─── Messages Table ───────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "messages" {
  name         = "${local.prefix}-messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "conversationId"
  range_key    = "messageId"

  attribute {
    name = "conversationId"
    type = "S"
  }

  attribute {
    name = "messageId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "createdAt-index"
    hash_key        = "conversationId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "${local.prefix}-messages"
  }
}

# ─── Response Cache Table ─────────────────────────────────────────────────────
resource "aws_dynamodb_table" "response_cache" {
  name         = "${local.prefix}-response-cache"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "cacheKey"

  attribute {
    name = "cacheKey"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "hitCount"
    type = "N"
  }

  global_secondary_index {
    name            = "category-hitCount-index"
    hash_key        = "category"
    range_key       = "hitCount"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "${local.prefix}-response-cache"
  }
}

# ─── Analytics Table ──────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "analytics" {
  name         = "${local.prefix}-analytics"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "metricType"
  range_key    = "timestamp"

  attribute {
    name = "metricType"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  global_secondary_index {
    name            = "date-index"
    hash_key        = "date"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "${local.prefix}-analytics"
  }
}

# ─── Feedback Table ───────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "feedback" {
  name         = "${local.prefix}-feedback"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedbackId"

  attribute {
    name = "feedbackId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-createdAt-index"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${local.prefix}-feedback"
  }
}

# ─── Audit Logs Table ─────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "audit_logs" {
  name         = "${local.prefix}-audit-logs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "auditId"

  attribute {
    name = "auditId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "action"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-timestamp-index"
    hash_key        = "userId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "action-timestamp-index"
    hash_key        = "action"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "${local.prefix}-audit-logs"
  }
}

# ─── Knowledge Base Table ─────────────────────────────────────────────────────
resource "aws_dynamodb_table" "knowledge_base" {
  name         = "${local.prefix}-knowledge-base"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "knowledgeId"

  attribute {
    name = "knowledgeId"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "updatedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "category-updatedAt-index"
    hash_key        = "category"
    range_key       = "updatedAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${local.prefix}-knowledge-base"
  }
}
