variable "environment" {
  type = string
}

variable "app_name" {
  type = string
}

variable "ses_from_email" {
  type = string
}

variable "callback_urls" {
  type = list(string)
}

variable "logout_urls" {
  type = list(string)
}

variable "aws_account_id" {
  type        = string
  description = "AWS account ID — used to make Cognito domain globally unique"
}
