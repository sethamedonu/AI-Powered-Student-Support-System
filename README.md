# AI-Powered Student Support System

A production-ready, cloud-native conversational AI assistant for educational institutions. Students get instant, accurate answers to questions about admissions, course registration, tuition, examinations, academic calendars, graduation requirements, scholarships, and campus services — powered by Amazon Bedrock and built entirely on AWS Serverless.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Students / Admins                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│              AWS Amplify Hosting + CloudFront CDN                   │
│                    Qwik Frontend (SSR + Resumability)               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ REST API (JWT)
┌──────────────────────────────▼──────────────────────────────────────┐
│                    Amazon API Gateway (REST)                         │
│              Cognito Authorizer + Rate Limiting + CORS              │
└──────┬──────────────┬──────────────┬──────────────┬─────────────────┘
       │              │              │              │
  ┌────▼────┐   ┌─────▼─────┐ ┌────▼────┐   ┌────▼────┐
  │  Auth   │   │   Chat    │ │Convos   │   │ Admin   │
  │ Lambda  │   │  Lambda   │ │ Lambda  │   │ Lambda  │
  └────┬────┘   └─────┬─────┘ └────┬────┘   └────┬────┘
       │              │              │              │
       │         ┌────▼────┐         │              │
       │         │   SQS   │         │              │
       │         │  Queue  │         │              │
       │         └────┬────┘         │              │
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼─────────────────┐
│                         Amazon DynamoDB                              │
│  Users │ Conversations │ Messages │ Cache │ Analytics │ Knowledge   │
└─────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    AI Provider Interface                             │
│         ┌──────────────────────────────────────────┐               │
│         │  1. DynamoDB Cache Check                  │               │
│         │  2. Knowledge Base Lookup                 │               │
│         │  3. Amazon Bedrock Invocation             │               │
│         │     ├── Nova Lite (routine questions)     │               │
│         │     └── Claude 3.5 (complex reasoning)   │               │
│         │  4. Bedrock Guardrails (content filter)  │               │
│         └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Qwik + Qwik City, TypeScript, Tailwind CSS v4, Qwik UI, Framer Motion |
| Backend | AWS Lambda (Node.js 22), TypeScript, Clean Architecture |
| Database | Amazon DynamoDB (8 tables with GSIs) |
| Auth | Amazon Cognito (JWT, RBAC, MFA) |
| AI | Amazon Bedrock (Nova Lite + Claude 3.5 Sonnet), Guardrails |
| Async | Amazon SQS (chat queue + DLQ) |
| Email | Amazon SES |
| Alerts | Amazon SNS |
| Hosting | AWS Amplify + CloudFront |
| DNS/SSL | Route 53 + ACM |
| IaC | Terraform (modular, remote state) |
| CI/CD | GitHub Actions |
| Local Dev | Docker + LocalStack |
| Testing | Vitest, Playwright, Postman/Newman |
| Monitoring | CloudWatch Logs, Metrics, Dashboards, Alarms |

---

## Project Structure

```
ai-powered-student-support-system/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, test, build on every PR
│       ├── deploy.yml          # Infrastructure + backend deployment
│       ├── e2e.yml             # Playwright E2E tests
│       └── api-tests.yml       # Newman API tests
│
├── frontend/                   # Qwik application
│   ├── src/
│   │   ├── components/         # Atomic design components
│   │   ├── routes/             # Qwik City file-based routing
│   │   ├── lib/                # Utilities, API client, auth
│   │   └── styles/             # Global styles
│   └── tests/                  # Vitest + Playwright tests
│
├── backend/                    # Lambda functions (Clean Architecture)
│   ├── src/
│   │   ├── functions/          # Lambda handlers by domain
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── conversations/
│   │   │   ├── admin/
│   │   │   ├── analytics/
│   │   │   ├── feedback/
│   │   │   └── health/
│   │   ├── core/
│   │   │   ├── domain/         # Entities, repositories (interfaces), value objects
│   │   │   ├── application/    # Use cases, services, DTOs
│   │   │   └── infrastructure/ # DynamoDB repos, AI provider, DB client
│   │   └── shared/             # Middleware, utils, types, errors
│   └── tests/
│
├── infrastructure/             # Terraform IaC
│   ├── bootstrap/              # Remote state S3 + DynamoDB lock
│   ├── modules/                # Reusable Terraform modules
│   │   ├── cognito/
│   │   ├── dynamodb/
│   │   ├── lambda/
│   │   ├── api-gateway/
│   │   ├── amplify/
│   │   ├── sqs/
│   │   ├── sns/
│   │   ├── ses/
│   │   ├── cloudwatch/
│   │   ├── iam/
│   │   ├── route53/
│   │   └── acm/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── prod/
│
├── docs/
│   ├── architecture/           # Architecture diagrams
│   ├── api/                    # OpenAPI spec + Postman collections
│   └── deployment/             # Deployment guides
│
├── docker/
│   ├── frontend/Dockerfile
│   └── lambda/Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker Desktop
- AWS CLI (configured)
- GitHub CLI (`gh`)
- Terraform 1.9+

### 1. Clone & Install

```bash
git clone https://github.com/sethamedonu/AI-Powered-Student-Support-System.git
cd AI-Powered-Student-Support-System
cp .env.example .env
npm install
```

### 2. Start Local Development

```bash
# Start all services (LocalStack, frontend, backend, DynamoDB Admin)
docker-compose up -d

# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# DynamoDB Admin UI: http://localhost:8001
# LocalStack: http://localhost:4566
```

### 3. Bootstrap Terraform Remote State

```bash
cd infrastructure/bootstrap
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your AWS account ID
terraform init
terraform apply
```

### 4. Deploy Infrastructure (Dev)

```bash
cd infrastructure/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

---

## AI Response Strategy

The system uses a multi-layer cost optimization strategy before invoking Bedrock:

```
Student Question
      │
      ▼
1. DynamoDB Cache Lookup ──── HIT ──► Return cached response (free)
      │ MISS
      ▼
2. Knowledge Base Search ──── FOUND ► Generate with context (cheap)
      │ NOT FOUND
      ▼
3. Route by Complexity
   ├── Simple ──► Amazon Nova Lite (fast, cheap)
   └── Complex ► Anthropic Claude 3.5 (accurate, thorough)
      │
      ▼
4. Apply Bedrock Guardrails (content filtering)
      │
      ▼
5. Cache response in DynamoDB for future reuse
      │
      ▼
Return response to student
```

---

## DynamoDB Tables

| Table | Partition Key | Sort Key | Purpose |
|-------|--------------|----------|---------|
| `aisss-{env}-users` | `userId` | — | User profiles |
| `aisss-{env}-conversations` | `userId` | `conversationId` | Conversation metadata |
| `aisss-{env}-messages` | `conversationId` | `messageId` | Chat messages |
| `aisss-{env}-response-cache` | `cacheKey` | — | Cached AI responses |
| `aisss-{env}-analytics` | `metricType` | `timestamp` | Usage analytics |
| `aisss-{env}-feedback` | `feedbackId` | — | User feedback |
| `aisss-{env}-audit-logs` | `auditId` | — | Security audit trail |
| `aisss-{env}-knowledge-base` | `knowledgeId` | — | Institutional knowledge |

---

## GitHub Actions Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for OIDC-based deployment |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `GH_ACCESS_TOKEN` | GitHub PAT for Amplify repository access |
| `DOMAIN` | Your root domain name |
| `SES_FROM_EMAIL` | Verified SES sender email |
| `ALERT_EMAIL` | Email for SNS infrastructure alerts |
| `E2E_TEST_USER_EMAIL` | Test user email for Playwright E2E |
| `E2E_TEST_USER_PASSWORD` | Test user password for Playwright E2E |

---

## Environments

| Environment | Branch | Purpose |
|-------------|--------|---------|
| `dev` | `dev` | Active development |
| `staging` | `staging` | Pre-production testing |
| `prod` | `main` | Production |

---

## Security

- All API endpoints protected by Cognito JWT authorizer
- IAM least-privilege per Lambda function
- DynamoDB encryption at rest + PITR enabled on all tables
- Bedrock Guardrails for content filtering
- No secrets or AI endpoints exposed to frontend
- HTTPS enforced via ACM + CloudFront
- Secrets managed via GitHub Actions secrets (never in code)
- OIDC-based AWS authentication in CI/CD (no long-lived keys)

---

## Milestones

- [x] **Milestone 1** — Project setup, structure, Terraform base, GitHub Actions, Docker
- [x] **Milestone 2** — Backend core (clean architecture, middleware, error handling)
- [x] **Milestone 3** — Authentication (Cognito integration, JWT, RBAC)
- [x] **Milestone 4** — AI layer (provider interface, Bedrock, caching, SQS)
- [x] **Milestone 5** — Frontend (Qwik app, all pages, chat UI, dark mode)
- [x] **Milestone 6** — Admin dashboard & analytics
- [x] **Milestone 7** — Monitoring, alerts, observability
- [x] **Milestone 8** — Testing (Vitest, Playwright, Newman)
- [x] **Milestone 9** — Documentation & final polish

---

## License

MIT — Built for educational institutions.
