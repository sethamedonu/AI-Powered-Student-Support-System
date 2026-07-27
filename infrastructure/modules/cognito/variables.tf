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
