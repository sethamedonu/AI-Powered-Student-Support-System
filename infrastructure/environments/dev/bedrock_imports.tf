# ─── Import manually-created Bedrock guardrail ───────────────────────────────
# The guardrail was created manually in the AWS console before being codified.
# These import blocks bring it under Terraform management without recreating it.
# Safe to keep permanently — Terraform skips imports for resources already in state.

import {
  to = module.bedrock.aws_bedrock_guardrail.main
  id = "41o24dvt9a6q"
}

# Note: the published version (aws_bedrock_guardrail_version.v1) did not exist
# before Terraform management — it will be created fresh on first apply.
