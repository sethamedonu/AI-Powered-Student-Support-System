variable "environment" { type = string }
variable "app_name" { type = string }
variable "alert_email" { type = string }

variable "monthly_budget_usd" {
  type        = string
  default     = "50"
  description = "Monthly AWS budget limit in USD"
}
