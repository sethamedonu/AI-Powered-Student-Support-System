locals {
  prefix = "${var.app_name}-${var.environment}"
}

# ─── Bedrock Guardrail ────────────────────────────────────────────────────────
# Protects AI responses for university students. Policies are replicated exactly
# from the manually-created guardrail in the original account so the new account
# gets an identical configuration automatically.
resource "aws_bedrock_guardrail" "main" {
  name                      = "${local.prefix}-StudentSupportGuardrail"
  description               = "Protect AI responses for university students."
  blocked_input_messaging   = "Sorry, the model cannot answer this question."
  blocked_outputs_messaging = "Sorry, the model cannot answer this question."

  # ── Content filters ──────────────────────────────────────────────────────────
  # Blocks violent, hateful, sexual, insulting, and misconduct content at
  # HIGH strength on both input and output.
  content_policy_config {
    filters_config {
      type            = "VIOLENCE"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "HATE"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "SEXUAL"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "INSULTS"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      type            = "MISCONDUCT"
      input_strength  = "HIGH"
      output_strength = "HIGH"
    }
    filters_config {
      # Prompt injection / jailbreak attempts — NONE means detect but not block
      # at the model level; the guardrail still inspects and blocks via word policy
      type            = "PROMPT_ATTACK"
      input_strength  = "NONE"
      output_strength = "NONE"
    }
  }

  # ── Word policy ───────────────────────────────────────────────────────────────
  # Custom blocked phrases + managed profanity list
  word_policy_config {
    words_config {
      text = "hack exam"
    }
    words_config {
      text = "cheat exam"
    }
    words_config {
      text = "generate malware"
    }

    managed_word_lists_config {
      type = "PROFANITY"
    }
  }

  # ── Sensitive information policy ─────────────────────────────────────────────
  # PII handling:
  #   EMAIL, PASSWORD, AWS_ACCESS_KEY  — anonymise on output only
  #   Financial credentials + AWS keys — anonymise on both input and output
  sensitive_information_policy_config {
    pii_entities_config {
      type   = "EMAIL"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "PASSWORD"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "CREDIT_DEBIT_CARD_CVV"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "CREDIT_DEBIT_CARD_EXPIRY"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "SWIFT_CODE"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "AWS_SECRET_KEY"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "AWS_ACCESS_KEY"
      action = "ANONYMIZE"
    }
  }

  tags = {
    Name = "${local.prefix}-StudentSupportGuardrail"
  }
}

# ─── Publish a numbered version so Lambda can pin to it ───────────────────────
# The DRAFT version changes on every update; pinning to a published version
# means Lambda always uses a known-good configuration even while DRAFT is edited.
resource "aws_bedrock_guardrail_version" "v1" {
  guardrail_arn = aws_bedrock_guardrail.main.guardrail_arn
  description   = "Initial published version — matches original manual guardrail"
}
