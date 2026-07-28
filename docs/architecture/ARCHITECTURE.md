# Architecture

## Overview

AI-Powered Student Support System (AISSS) is a serverless, cloud-native conversational AI platform built entirely on AWS. Students interact with an AI assistant that answers questions about admissions, tuition, registration, exams, and campus services.

---

## Key Design Decisions

### Serverless-first

All compute runs on AWS Lambda (Node.js 22). No EC2, no containers in production. This gives:
- Zero idle cost — pay only per invocation
- Automatic scaling from 0 to thousands of concurrent users
- No patching or capacity planning

### Clean Architecture in Lambda

Each Lambda function follows Clean Architecture layers:

```
Handler (functions/)
  └── Use Case (application/)
        └── Repository Interface (domain/)
              └── DynamoDB Implementation (infrastructure/)
```

The AI provider is behind an `IAIProvider` interface — swapping Bedrock for another model requires changing only the infrastructure layer.

### Multi-layer AI Cost Optimization

Before invoking Bedrock (which costs per token), the system checks cheaper layers first:

```
Request
  │
  ▼ 1. DynamoDB cache lookup (free, ~5ms)
  │    HIT → return cached response
  │
  ▼ 2. Knowledge base search (free, ~10ms)
  │    FOUND → generate with context using Nova Lite
  │
  ▼ 3. Route by complexity
  │    Simple → Amazon Nova Lite (~$0.00006/1K tokens)
  │    Complex → Claude 3.5 Sonnet (~$0.003/1K tokens)
  │
  ▼ 4. Bedrock Guardrails (content filter)
  │
  ▼ 5. Cache response in DynamoDB (TTL: 24h)
```

Cache hit rates of 40–60% are typical for FAQ-style questions, significantly reducing Bedrock costs.

### Asynchronous Chat via SQS

The chat Lambda enqueues messages to SQS rather than calling Bedrock synchronously in the API path. This:
- Prevents API Gateway 29-second timeout from affecting complex AI responses
- Provides natural retry/DLQ for failed AI invocations
- Decouples the frontend polling from Bedrock latency

### JWT Authentication via Cognito

All API endpoints (except `/health`) require a valid Cognito JWT. The Lambda handler middleware:
1. Extracts the `Authorization: Bearer <token>` header
2. Fetches the Cognito JWKS endpoint (cached in memory)
3. Verifies signature, expiry, and audience
4. Attaches `{ userId, email, role, groups }` to the request context

RBAC is enforced at the handler level via `requireAdmin: true` on admin endpoints.

---

## Data Flow

### Chat Message Flow

```
Student → POST /chat/message (JWT)
  → API Gateway (Cognito authorizer)
  → Chat Lambda
      → Validate input (Zod)
      → Create/update conversation in DynamoDB
      → Enqueue to SQS
      → SQS triggers AI Lambda
          → Cache lookup
          → Knowledge base lookup
          → Bedrock invocation (Nova Lite or Claude 3.5)
          → Guardrails filter
          → Store message + cache response
      → Return response to student
```

### Auth Flow

```
Student → POST /auth/login
  → Auth Lambda
  → Cognito InitiateAuth
  → Returns { accessToken, idToken, refreshToken }
  → Frontend stores in localStorage
  → Subsequent requests: Authorization: Bearer <accessToken>
```

---

## DynamoDB Access Patterns

Each table is designed around its primary access pattern:

| Table | Primary Pattern | GSI |
|-------|----------------|-----|
| users | Get by userId | email-index (login lookup) |
| conversations | List by userId | status-index (active filter) |
| messages | List by conversationId | createdAt sort |
| response-cache | Get by cacheKey (hash of question) | ttl (auto-expire) |
| analytics | Query by metricType + date range | — |
| feedback | Scan sorted by createdAt | userId-index |
| audit-logs | Scan by auditId | userId-index, action-index |
| knowledge-base | Get by knowledgeId | category-index |

All tables use on-demand billing (PAY_PER_REQUEST), encryption at rest, and PITR.

---

## Observability

### EMF Metrics (Zero SDK)

Metrics are emitted as structured JSON to stdout using the Embedded Metric Format. CloudWatch Logs agent parses them automatically — no SDK calls, no added latency:

```json
{
  "_aws": {
    "Timestamp": 1700000000000,
    "CloudWatchMetrics": [{
      "Namespace": "AISSS/Lambda",
      "Dimensions": [["Environment", "FunctionName"]],
      "Metrics": [{ "Name": "AILatencyMs", "Unit": "Milliseconds" }]
    }]
  },
  "Environment": "prod",
  "FunctionName": "chat",
  "AILatencyMs": 1240
}
```

### Cold Start Detection

A module-level `isColdStart` flag is set to `true` on Lambda init and flipped to `false` after the first invocation. Cold starts emit a `ColdStart` EMF metric, visible in CloudWatch.

### Alarms

| Alarm | Threshold | Action |
|-------|-----------|--------|
| Lambda errors | > 5 in 5 min | SNS email |
| Lambda duration p99 | > 10s (dev) / 5s (prod) | SNS email |
| Lambda throttles | > 10 in 5 min | SNS email |
| API Gateway 5xx | > 10 in 5 min | SNS email |
| SQS DLQ depth | > 1 message | SNS email |
| Monthly budget | 80% actual / 100% forecast | Email |

---

## Security Model

- All API endpoints protected by Cognito JWT authorizer at API Gateway level
- Lambda functions have least-privilege IAM roles (separate role per function group)
- DynamoDB encryption at rest (AWS managed key) + PITR on all tables
- Bedrock Guardrails block harmful content before responses reach students
- No secrets in code — all sensitive values via GitHub Actions secrets or environment variables
- OIDC-based AWS authentication in CI/CD (no long-lived access keys)
- HTTPS enforced via ACM + CloudFront on all endpoints
- Frontend never receives Bedrock credentials or model identifiers

---

## Frontend Architecture

The Qwik frontend uses resumability (not hydration) — the framework serializes component state into HTML and resumes execution on the client without re-running server code. This gives near-instant interactivity even on slow connections.

Route structure follows Qwik City file-based routing:

```
routes/
  index.tsx          → / (redirect to dashboard or login)
  auth/login/        → /auth/login
  dashboard/         → /dashboard
  chat/              → /chat
  conversations/[id] → /conversations/:id
  admin/             → /admin (role-guarded)
```

Auth state is stored in localStorage and validated on every protected route load via a `useVisibleTask$` guard that redirects unauthenticated users to `/auth/login`.

---

## Infrastructure as Code

All AWS resources are managed by Terraform with:
- Remote state in S3 (encrypted, versioned)
- State locking via DynamoDB
- Modular structure — 12 reusable modules
- Three environments (dev/staging/prod) with environment-specific tuning
- `terraform fmt` enforced in CI

Environment differences:

| Setting | Dev | Staging | Prod |
|---------|-----|---------|------|
| Log retention | 30 days | 60 days | 365 days |
| Duration alarm | 10s | 8s | 5s |
| Monthly budget | $50 | $100 | $500 |
| Guardrail required | No | No | Yes |
| CORS origins | localhost + dev domain | staging domain | prod domain only |
