variable "rest_api_id" { type = string }
variable "parent_id" { type = string }
variable "path_part" { type = string }
variable "http_method" { type = string }
variable "lambda_arn" { type = string }
variable "aws_region" { type = string }
variable "authorizer_id" { type = string }
variable "require_auth" { type = bool }
variable "use_parent" {
  type    = bool
  default = false
}

variable "create_options" {
  type        = bool
  default     = true
  description = "Whether to create the CORS OPTIONS method for this route. Set false when another route on the same resource already creates it."
}
