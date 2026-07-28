# Deployment Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | https://nodejs.org |
| AWS CLI | 2.x | https://aws.amazon.com/cli |
| Terraform | 1.9+ | https://developer.hashicorp.com/terraform/install |
| Docker Desktop | latest | https://www.docker.com/products/docker-desktop |
| GitHub CLI | latest | https://cli.github.com |

Configure AWS CLI before proceeding:

```bash
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: us-east-1
# Default output format: json
```

---

## 1. Clone & Install

```bash
git clone https://github.com/sethamedonu/AI-Powered-Student-Support-System.git
cd AI-Powered-Student-Support-System
cp .env.example .env
# Edit .env with your values
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

## 2. Local Development

Start all services with Docker Compose (LocalStack + frontend + backend + DynamoDB Admin):

```bash
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Frontend (Qwik) | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| DynamoDB Admin UI | http://localhost:8001 |
| LocalStack | http://localhost:4566 |

Stop services:

```bash
docker-compose down
```

---

## 3. Bootstrap Terraform Remote State

Run once per AWS account to create the S3 state bucket and DynamoDB lock table:

```bash
cd infrastructure/bootstrap
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set your AWS account ID
terraform init
terraform apply
```

This creates:
- S3 bucket: `aisss-terraform-state-<account-id>`
- DynamoDB table: `aisss-terraform-locks`

---

## 4. GitHub Actions Secrets

Set these secrets in your GitHub repository (`Settings → Secrets and variables → Actions`):

| Secret | Description |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for OIDC-based deployment |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `GH_ACCESS_TOKEN` | GitHub PAT for Amplify repository access |
| `DOMAIN` | Your root domain (e.g. `yourdomain.com`) |
| `SES_FROM_EMAIL` | Verified SES sender email |
| `ALERT_EMAIL` | Email for SNS infrastructure alerts |
| `E2E_TEST_USER_EMAIL` | Test user email for Playwright E2E |
| `E2E_TEST_USER_PASSWORD` | Test user password for Playwright E2E |

### Create the OIDC IAM Role

```bash
# Replace <account-id> and <github-org/repo>
aws iam create-role \
  --role-name aisss-github-deploy-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": { "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<github-org/repo>:*" }
      }
    }]
  }'

aws iam attach-role-policy \
  --role-name aisss-github-deploy-role \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

> For production, replace `AdministratorAccess` with a least-privilege custom policy.

---

## 5. Deploy to Dev

```bash
cd infrastructure/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

Or trigger via GitHub Actions by pushing to the `dev` branch.

---

## 6. Deploy to Staging

```bash
cd infrastructure/environments/staging
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars
terraform init
terraform plan
terraform apply
```

Or push to the `staging` branch — the deploy workflow applies automatically.

---

## 7. Deploy to Production

```bash
cd infrastructure/environments/prod
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — no placeholder defaults, all values required
terraform init
terraform plan   # Review carefully before applying
terraform apply
```

Or merge to `main` — the deploy workflow applies automatically.

> Production differences vs dev/staging:
> - Log retention: 365 days (vs 30/60)
> - Lambda duration alarm threshold: 5000ms (vs 8000/10000)
> - Monthly budget: $500 (configurable via `monthly_budget_usd`)
> - `bedrock_guardrail_id` is required (no default)
> - All Cognito/CORS URLs must be explicit HTTPS — no localhost

---

## 8. Deploy Backend Lambda Functions

After infrastructure is provisioned, deploy Lambda function code:

```bash
cd backend
npm run build
npm run deploy:dev       # or deploy:staging / deploy:prod
```

The deploy script bundles each function with esbuild and updates the Lambda function code via AWS CLI.

---

## 9. Seed Knowledge Base (Optional)

To pre-populate the DynamoDB knowledge base table with institutional FAQs:

```bash
# Example: add a knowledge item directly
aws dynamodb put-item \
  --table-name aisss-dev-knowledge-base \
  --item '{
    "knowledgeId": {"S": "kb-001"},
    "category": {"S": "tuition"},
    "question": {"S": "What are the tuition fees?"},
    "answer": {"S": "Undergraduate tuition is $X per semester..."},
    "keywords": {"SS": ["tuition", "fees", "cost"]},
    "isActive": {"BOOL": true},
    "createdAt": {"S": "2024-01-01T00:00:00.000Z"}
  }'
```

---

## 10. Verify Deployment

```bash
# Check health endpoint
curl https://api-dev.yourdomain.com/health

# Expected response
{
  "success": true,
  "data": {
    "status": "healthy",
    "environment": "dev",
    "checks": {
      "dynamodb": { "status": "ok", "latencyMs": 12 },
      "sqs": { "status": "ok", "latencyMs": 8 }
    }
  }
}
```

---

## 11. Run API Tests (Newman)

```bash
npm install -g newman newman-reporter-htmlextra

newman run docs/api/aisss-api-collection.json \
  --environment docs/api/environments/dev.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export newman-report.html
```

---

## 12. Destroy Infrastructure

```bash
# Dev only — never run on prod without a plan
cd infrastructure/environments/dev
terraform destroy
```

> DynamoDB tables have `prevent_destroy = true` in prod. Remove the lifecycle block manually if a full teardown is needed.

---

## Troubleshooting

**Terraform init fails (backend not found)**
Run the bootstrap step first — the S3 bucket must exist before any environment init.

**Lambda deployment fails (function not found)**
Ensure `terraform apply` completed successfully before running `npm run deploy:*`.

**Cognito auth errors in frontend**
Verify `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` match the Terraform outputs:
```bash
terraform output cognito_user_pool_id
terraform output cognito_client_id
```

**Bedrock access denied**
Request model access in the AWS Console: `Amazon Bedrock → Model access → Manage model access`.
Enable `Amazon Nova Lite` and `Anthropic Claude 3.5 Sonnet`.
