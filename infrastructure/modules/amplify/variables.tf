variable "environment" { type = string }
variable "app_name" { type = string }
variable "github_repository" { type = string }
variable "github_access_token" {
  type      = string
  sensitive = true
}
variable "domain" { type = string }
variable "acm_certificate_arn" { type = string }
variable "environment_variables" {
  type    = map(string)
  default = {}
}
