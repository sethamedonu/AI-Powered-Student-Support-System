<div align="center">

<img src="https://img.shields.io/badge/AWS-Serverless-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
<img src="https://img.shields.io/badge/Amazon_Bedrock-AI_Powered-6366F1?style=for-the-badge&logo=amazonaws&logoColor=white" />
<img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
<img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/Terraform-1.9-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
<img src="https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge" />

<br /><br />

<h1>🎓 AI-Powered Student Support System</h1>

<p align="center">
  <strong>A production-ready, cloud-native conversational AI assistant for educational institutions.</strong><br />
  Students get instant, accurate answers about admissions, registration, tuition, exams, scholarships,<br />
  and campus services — powered by <strong>Amazon Bedrock</strong> and built entirely on <strong>AWS Serverless</strong>.
</p>

<br />

[![CI](https://img.shields.io/github/actions/workflow/status/sethamedonu/AI-Powered-Student-Support-System/ci.yml?branch=main&label=CI&logo=githubactions&logoColor=white&style=flat-square)](https://github.com/sethamedonu/AI-Powered-Student-Support-System/actions)
[![Deploy](https://img.shields.io/github/actions/workflow/status/sethamedonu/AI-Powered-Student-Support-System/deploy.yml?branch=main&label=Deploy&logo=githubactions&logoColor=white&style=flat-square)](https://github.com/sethamedonu/AI-Powered-Student-Support-System/actions)
[![Last Commit](https://img.shields.io/github/last-commit/sethamedonu/AI-Powered-Student-Support-System?style=flat-square&logo=git&logoColor=white)](https://github.com/sethamedonu/AI-Powered-Student-Support-System/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/sethamedonu/AI-Powered-Student-Support-System?style=flat-square)](https://github.com/sethamedonu/AI-Powered-Student-Support-System)

</div>

---

## ✨ Key Features

| | Feature | Description |
|---|---|---|
| 🤖 | **Multi-Model AI** | Routes questions to Amazon Nova Lite or Claude 3.5 Sonnet based on complexity |
| ⚡ | **Smart Caching** | DynamoDB response cache eliminates redundant Bedrock calls — instant repeat answers |
| 📚 | **Knowledge Base** | Institutional knowledge lookup before AI invocation for accurate, grounded responses |
| 🛡️ | **Guardrails** | Amazon Bedrock Guardrails enforce content safety on every AI response |
| 🔐 | **Secure Auth** | Amazon Cognito with JWT, RBAC, and MFA — zero secrets exposed to the frontend |
| 📊 | **Admin Dashboard** | Real-time analytics, user management, feedback review, and knowledge base editing |
| 🌍 | **Multi-Environment** | Dev, staging, and prod environments managed with modular Terraform |
| 🔄 | **Full CI/CD** | GitHub Actions pipeline — lint, test, build, Terraform apply, Lambda deploy |
| 🐳 | **Local Dev** | Full local stack with Docker Compose + LocalStack — no AWS account needed to develop |
| 📡 | **Observability** | CloudWatch Logs, Metrics, Dashboards, and Alarms across all services |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Students / Admins                           │
│                    (Browser — Qwik SSR App)                      │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼────────────────────────────────────────┐
│           AWS Amplify Hosting  +  CloudFront CDN                 │
└─────────────────────────┬────────────────────────────────────────┘
                          │ REST API  (JWT Bearer)
┌─────────────────────────▼────────────────────────────────────────┐
│              Amazon API Gateway  (REST)                          │
│         Cognito Authorizer · Rate Limiting · CORS                │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
  ┌────▼────┐   ┌─────▼─────┐  ┌───▼────┐   ┌────▼────┐
  │  Auth   │   │   Chat    │  │ Convos │   │  Admin  │
  │ Lambda  │   │  Lambda   │  │ Lambda │   │ Lambda  │
  └────┬────┘   └─────┬─────┘  └───┬────┘   └────┬────┘
       │              │             │              │
       │         ┌────▼────┐        │              │
       │         │   SQS   │        │              │
       │         │  Queue  │        │              │
       │         └────┬────┘        │              │
       │              │             │              │
┌──────▼──────────────▼─────────────▼──────────────▼──────────────┐
│                       Amazon DynamoDB                            │
│   Users · Conversations · Messages · Cache · Analytics ·        │
│                  Feedback · Audit Logs · Knowledge Base          │
└─────────────────────────┬────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────┐
│                   AI Provider Interface                          │
│                                                                  │
│   1. DynamoDB Cache Check  ──────────── HIT → return (free)     │
│   2. Knowledge Base Lookup ──────────── FOUND → ground response │
│   3. Route by Complexity                                         │
│      ├── Simple  → Amazon Nova Lite   (fast · cheap)            │
│      └── Complex → Claude 3.5 Sonnet  (accurate · thorough)     │
│   4. Bedrock Guardrails  (content safety filter)                 │
│   5. Cache response for future reuse                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
![Qwik](https://img.shields.io/badge/Qwik-1.20-18B6F6?style=flat-square&logo=qwik&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-Serverless-FF9900?style=flat-square&logo=awslambda&logoColor=white)
![Clean Architecture](https://img.shields.io/badge/Clean_Architecture-Domain_Driven-6366F1?style=flat-square)

### AWS Services
![Amazon Bedrock](https://img.shields.io/badge/Amazon_Bedrock-Nova_Lite_%7C_Claude_3.5-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-8_Tables-4053D6?style=flat-square&logo=amazondynamodb&logoColor=white)
![Cognito](https://img.shields.io/badge/Cognito-JWT_%7C_RBAC_%7C_MFA-DD344C?style=flat-square&logo=amazonaws&logoColor=white)
![API Gateway](https://img.shields.io/badge/API_Gateway-REST-FF4F8B?style=flat-square&logo=amazonaws&logoColor=white)
![SQS](https://img.shields.io/badge/SQS-Chat_Queue_%7C_DLQ-FF9900?style=flat-square&logo=amazonsqs&logoColor=white)
![CloudFront](https://img.shields.io/badge/CloudFront-CDN-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![Amplify](https://img.shields.io/badge/Amplify-Hosting-FF9900?style=flat-square&logo=awsamplify&logoColor=white)
![SES](https://img.shields.io/badge/SES-Email-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![SNS](https://img.shields.io/badge/SNS-Alerts-FF9900?style=flat-square&logo=amazonaws&logoColor=white)
![CloudWatch](https://img.shields.io/badge/CloudWatch-Monitoring-FF9900?style=flat-square&logo=amazonaws&logoColor=white)

### Infrastructure & DevOps
![Terraform](https://img.shields.io/badge/Terraform-1.9-7B42BC?style=flat-square&logo=terraform&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![LocalStack](https://img.shields.io/badge/LocalStack-Local_AWS-1A1A2E?style=flat-square)

### Testing
![Vitest](https://img.shields.io/badge/Vitest-Unit_%7C_Integration-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Newman](https://img.shields.io/badge/Newman-API_Tests-FF6C37?style=flat-square&logo=postman&logoColor=white)

---

## 📁 Project Structure

```
ai-powered-student-support-system/
│
├── .github/workflows/
│   ├── ci.yml              # Lint, test, build on every PR
│   ├── deploy.yml          # Terraform + Lambda deployment
│   ├── e2e.yml             # Playwright end-to-end tests
│   └── api-tests.yml       # Newman API tests
│
├── frontend/               # Qwik SSR application
│   └── src/
│       ├── components/     # Atomic design components
│       ├── routes/         # File-based routing (Qwik City)
│       ├── lib/            # API client, auth, utilities
│       └── global.css      # Tailwind v4 design system
│
├── backend/                # Lambda functions — Clean Architecture
│   └── src/
│       ├── functions/      # Handlers: auth · chat · conversations · admin
│       ├── core/
│       │   ├── domain/     # Entities, repository interfaces, value objects
│       │   ├── application/# Use cases, services, DTOs
│       │   └── infrastructure/ # DynamoDB repos, AI provider, DB client
│       └── shared/         # Middleware, error handling, types
│
├── infrastructure/         # Terraform IaC (modular)
│   ├── bootstrap/          # Remote state: S3 + DynamoDB lock table
│   ├── modules/            # cognito · dynamodb · lambda · api-gateway
│   │                       # amplify · sqs · sns · ses · cloudwatch · iam
│   └── environments/       # dev · staging · prod
│
├── docker/
│   ├── frontend/Dockerfile
│   ├── lambda/Dockerfile
│   └── localstack/init.sh  # Auto-creates all AWS resources locally
│
├── docs/
│   ├── architecture/
│   ├── api/                # OpenAPI spec + Postman collection
│   └── deployment/
│
├── docker-compose.yml      # Full local stack
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22+ |
| Docker Desktop | Latest |
| AWS CLI | Configured |
| Terraform | 1.9+ |

### 1 — Clone & Install

```bash
git clone https://github.com/sethamedonu/AI-Powered-Student-Support-System.git
cd AI-Powered-Student-Support-System
cp .env.example .env
npm install
```

### 2 — Start Local Development

```bash
docker-compose up -d
```

| Service | URL |
|---------|-----|
| 🖥️ Frontend | http://localhost:5173 |
| ⚙️ Backend API | http://localhost:3000 |
| 🗄️ DynamoDB Admin | http://localhost:8001 |
| ☁️ LocalStack | http://localhost:4566 |

On first startup, LocalStack automatically creates all 8 DynamoDB tables, the SQS chat queue + DLQ, seeds the knowledge base, and prints the generated Cognito IDs. Copy them into your `.env`:

```bash
# Get the generated Cognito IDs
docker logs aisss-localstack

# Update .env, then restart
docker-compose restart backend frontend
```

**Test accounts created automatically:**

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | `admin@test.com` | `Admin123!` |
| 🎓 Student | `student@test.com` | `Student123!` |

> **💡 Note on Bedrock:** AI chat calls real AWS Bedrock even locally — LocalStack does not emulate it. Set real AWS credentials with Bedrock access in `.env` to enable AI responses. All other features work fully via LocalStack without AWS credentials.

---

## ☁️ Deploying to AWS

### Step 1 — Bootstrap Terraform Remote State

```bash
cd infrastructure/bootstrap
cp terraform.tfvars.example terraform.tfvars
# Edit with your AWS account ID
terraform init && terraform apply
```

### Step 2 — Deploy Infrastructure

```bash
cd infrastructure/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit with your domain, region, and email values
terraform init
terraform plan
terraform apply
```

### Step 3 — Configure GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN for OIDC-based deployment |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `GH_ACCESS_TOKEN` | GitHub PAT for Amplify repository access |
| `DOMAIN` | Your root domain name |
| `SES_FROM_EMAIL` | Verified SES sender email |
| `ALERT_EMAIL` | Email for SNS infrastructure alerts |
| `E2E_TEST_USER_EMAIL` | Test user for Playwright E2E |
| `E2E_TEST_USER_PASSWORD` | Test user password for Playwright E2E |

Push to `dev` branch to trigger the full CI/CD pipeline automatically.

### Step 4 — Seed Knowledge Base

The knowledge base is initially empty. Populate it with sample UCC (University of Cape Coast) content:

```bash
cd backend
npm install  # Installs pdf-lib for PDF generation
npm run seed:kb
```

This script:
- ✅ Creates 9 PDF documents with student information
- ✅ Uploads to S3 (`aisss-dev-knowledge-docs` bucket)
- ✅ Saves structured Q&A to DynamoDB
- ✅ Triggers Bedrock ingestion (wait 2-5 minutes)

**Content included:** Admissions, Registration, Tuition, Exams, Calendar, Graduation, Scholarships, Campus Services, General Information

**For detailed setup:** See [`RUN-SEED-SCRIPT.md`](./RUN-SEED-SCRIPT.md) and [`KNOWLEDGE-BASE-SETUP.md`](./KNOWLEDGE-BASE-SETUP.md)

---

## 🧠 AI Response Strategy

The system uses a **5-layer cost optimization pipeline** before invoking Bedrock:

```
Student Question
      │
      ▼
① DynamoDB Cache ──── HIT ──────────────► Return instantly   (free)
      │ MISS
      ▼
② Knowledge Base ──── FOUND ────────────► Ground the response (cheap)
      │ NOT FOUND
      ▼
③ Route by Complexity
      ├── Simple  ──► Amazon Nova Lite    (fast · low cost)
      └── Complex ──► Claude 3.5 Sonnet  (accurate · thorough)
      │
      ▼
④ Bedrock Guardrails  (content safety enforcement)
      │
      ▼
⑤ Cache in DynamoDB   (free on next identical question)
      │
      ▼
   Response delivered to student
```

---

## 🗄️ DynamoDB Tables

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

## 🔒 Security

- ✅ All API endpoints protected by Cognito JWT authorizer
- ✅ IAM least-privilege policy per Lambda function
- ✅ DynamoDB encryption at rest + Point-in-Time Recovery on all tables
- ✅ Bedrock Guardrails enforce content safety on every AI response
- ✅ Zero secrets or AI endpoints exposed to the frontend
- ✅ HTTPS enforced end-to-end via ACM + CloudFront
- ✅ Secrets managed via GitHub Actions secrets — never in code
- ✅ OIDC-based AWS authentication in CI/CD — no long-lived access keys

---

## 🌿 Environments

| Environment | Branch | Purpose |
|-------------|--------|---------|
| `dev` | `dev` | Active development & integration testing |
| `staging` | `staging` | Pre-production validation |
| `prod` | `main` | Live production |

---

## ✅ Milestones

- [x] **Milestone 1** — Project setup, Terraform base, GitHub Actions, Docker
- [x] **Milestone 2** — Backend core (clean architecture, middleware, error handling)
- [x] **Milestone 3** — Authentication (Cognito, JWT, RBAC)
- [x] **Milestone 4** — AI layer (Bedrock, caching, knowledge base, SQS)
- [x] **Milestone 5** — Frontend (Qwik, all pages, chat UI, dark mode)
- [x] **Milestone 6** — Admin dashboard & analytics
- [x] **Milestone 7** — Monitoring, alerts, observability
- [x] **Milestone 8** — Testing (Vitest, Playwright, Newman)
- [x] **Milestone 9** — Documentation & final polish

---

## 📄 Document Upload & Knowledge Base System

### Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DOCUMENT UPLOAD FLOW                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ① Request           ┌──────────────────┐
│              │     Upload URL           │                  │
│   Admin UI   │─────────────────────────▶│  Lambda          │
│ (Browser)    │                          │  uploadDocument  │
│              │◀─────────────────────────│                  │
└──────────────┘     ② Pre-signed URL     └──────────────────┘
       │                                            │
       │ ③ PUT file directly                       │ Generates
       │   (bypasses Lambda)                       │ signed URL
       │                                            ▼
       ▼                                   ┌──────────────────┐
┌──────────────┐                          │   S3 Bucket      │
│  S3 Bucket   │                          │  (Knowledge      │
│  admissions/ │◀─────────────────────────│   Docs)          │
│  tuition/    │   File stored            └──────────────────┘
│  uploads/    │
└──────────────┘
       │
       │ ④ Admin clicks "Sync Knowledge Base"
       │
       ▼
┌──────────────┐     ⑤ POST              ┌──────────────────┐
│   Admin UI   │     /admin/sync         │  Lambda          │
│              │─────────────────────────▶│  syncKnowledge   │
│              │                          │                  │
└──────────────┘                          └──────────────────┘
                                                    │
                                          ⑥ Triggers ingestion
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  Bedrock Agent   │
                                          │  StartIngestion  │
                                          │  Job             │
                                          └──────────────────┘
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              │                                           │
                              ▼                                           ▼
                    ┌──────────────────┐                      ┌──────────────────┐
                    │  Bedrock KB      │                      │  Bedrock KB      │
                    │  Reads S3 files  │                      │  Chunking        │
                    │                  │                      │  (512 tokens)    │
                    └──────────────────┘                      └──────────────────┘
                              │                                           │
                              └─────────────────────┬─────────────────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  Titan Embed V2  │
                                          │  Generates       │
                                          │  Embeddings      │
                                          └──────────────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  OpenSearch      │
                                          │  Serverless      │
                                          │  (Vector Store)  │
                                          └──────────────────┘
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              │     Documents now searchable!             │
                              │     Students can ask questions            │
                              └───────────────────────────────────────────┘
```

### Step-by-Step Breakdown

#### **Step 1: Admin Requests Upload URL**
```typescript
// Frontend calls:
POST /admin/documents/upload
{
  "fileName": "admission-policy-2026.pdf",
  "contentType": "application/pdf",
  "folder": "admissions"
}
```

**Backend Lambda (`uploadDocument.ts`):**
- Validates file type (PDF, DOC, DOCX, TXT, MD)
- Validates file name (no special characters)
- Generates S3 key: `admissions/1786012345-admission-policy-2026.pdf`
- Creates **pre-signed URL** (valid for 5 minutes)
- Returns URL to frontend

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/admissions/file.pdf?X-Amz-Signature=...",
  "s3Key": "admissions/1786012345-admission-policy-2026.pdf",
  "bucket": "aisss-dev-knowledge-docs"
}
```

#### **Step 2: Frontend Uploads File Directly to S3**
```javascript
// Browser sends file directly to S3 (no Lambda involved)
const xhr = new XMLHttpRequest();
xhr.open("PUT", uploadUrl);
xhr.setRequestHeader("Content-Type", "application/pdf");
xhr.send(pdfFile); // File binary data

// Progress tracking
xhr.upload.onprogress = (e) => {
  const progress = (e.loaded / e.total) * 100;
  // Show progress bar: 30%, 50%, 75%, 100%
};
```

**Why direct upload?**
- **No Lambda 6MB payload limit** — can upload 50MB files
- **Faster** — browser → S3 direct connection
- **Cheaper** — no Lambda execution time
- **Progress tracking** — real-time upload progress

#### **Step 3: File Stored in S3**
```
S3 Bucket: aisss-dev-knowledge-docs
├── admissions/
│   ├── 1786012345-admission-policy-2026.pdf  ← New file
│   └── 1785998765-requirements.pdf
├── tuition/
│   └── 1785995432-fee-schedule.pdf
└── uploads/
    └── 1785990123-general-info.pdf
```

**S3 Object Metadata:**
```json
{
  "original-name": "admission-policy-2026.pdf",
  "uploaded-at": "2026-08-06T10:15:32.000Z"
}
```

#### **Step 4: Admin Clicks "Sync Knowledge Base"**
**Why manual sync?**
- **Cost control** — ingestion jobs cost money, batch multiple uploads
- **Control** — admin decides when to make documents searchable
- **Validation** — admin can review uploaded files before indexing

#### **Step 5: Trigger Bedrock Ingestion**
```typescript
// Frontend calls:
POST /admin/documents/sync
{}

// Backend Lambda (syncKnowledge.ts):
const client = new BedrockAgentClient({ region: 'us-east-1' });
const response = await client.send(new StartIngestionJobCommand({
  knowledgeBaseId: 'ABCD1234',
  dataSourceId: 'WXYZ5678'
}));

// Returns:
{
  "jobId": "WUAOD4RIXD",
  "status": "STARTING",
  "message": "Knowledge base ingestion started. Documents will be searchable within 1–5 minutes."
}
```

#### **Step 6: Bedrock Processes Documents**

**6a. Read S3 Files**
- Bedrock reads **all files** in the S3 bucket
- Supports: PDF, DOC, DOCX, TXT, MD, HTML
- Max file size: 50MB per document

**6b. Chunking**
- Splits documents into **512-token chunks** with **20% overlap**
- Example PDF with 5000 words → ~10-12 chunks
- Preserves context by overlapping chunks

**Example chunks:**
```
Chunk 1: "Admission Requirements...eligibility criteria...minimum GPA of 3.0..."
Chunk 2: "...minimum GPA of 3.0...application process...submit transcripts..." (overlap)
Chunk 3: "...submit transcripts...deadline is March 15...international students..."
```

**6c. Embedding with Titan**
- Each chunk → **Titan Embed Text V2** model
- Generates **1024-dimensional vector** per chunk
- Vector represents semantic meaning

**Example:**
```
"What is the minimum GPA?" 
→ [0.234, -0.567, 0.891, ..., 0.123] (1024 numbers)

Chunk: "minimum GPA of 3.0"
→ [0.241, -0.554, 0.887, ..., 0.119] (similar vector!)
```

**6d. Store in OpenSearch Serverless**
- Vectors stored in **OpenSearch Serverless index**
- Metadata stored: file name, chunk number, S3 key, timestamp
- No minimum cluster size — pay per query

#### **Step 7: Documents Are Now Searchable**

When a student asks a question:

```typescript
// Student sends message:
"What are the admission requirements?"

// Chat Lambda (sendMessage.ts):
1. Retrieves relevant chunks from Knowledge Base
   const kbResponse = await bedrock.retrieve({
     query: "What are the admission requirements?",
     knowledgeBaseId: 'ABCD1234'
   });
   // Returns top 5 most similar chunks

2. Constructs prompt with context:
   "You are a university assistant. Use the following documents to answer:
    
    [Chunk 1]: Admission Requirements...minimum GPA of 3.0...
    [Chunk 2]: Application process...submit transcripts by March 15...
    [Chunk 3]: International students must also provide...
    
    Student question: What are the admission requirements?
    
    Answer:"

3. Sends to Claude/Nova
   const response = await bedrock.invokeModel({
     model: 'anthropic.claude-3-sonnet',
     prompt: constructedPrompt
   });

4. Returns grounded answer to student
   "To be eligible for admission, you need:
    - Minimum GPA of 3.0
    - Submit official transcripts by March 15
    - International students must provide..."
```

### Key Features

✅ **Direct S3 Upload** — Bypasses Lambda 6MB limit  
✅ **Pre-signed URLs** — Secure, time-limited (5 min)  
✅ **Folder Organization** — Admissions, Tuition, Exams, etc.  
✅ **File Type Validation** — PDF, DOC, DOCX, TXT, MD  
✅ **Size Limits** — 50MB per file (Bedrock limit)  
✅ **Progress Tracking** — Real-time upload progress bar  
✅ **Batch Sync** — Upload multiple files, sync once  
✅ **Admin-Only** — Requires `role: "admin"` and valid JWT  

### AWS Services Used

| Service | Purpose |
|---------|---------|
| **S3** | Store uploaded documents |
| **Lambda** | Generate pre-signed URLs, trigger ingestion |
| **Bedrock Knowledge Base** | Manage document indexing and retrieval |
| **Bedrock Agent** | Orchestrate ingestion jobs |
| **Titan Embed V2** | Generate vector embeddings |
| **OpenSearch Serverless** | Store and query vectors |
| **Claude 3 Sonnet** | Generate answers using retrieved context |

### Cost Breakdown

| Operation | Cost (Approximate) |
|-----------|-------------------|
| Upload 1MB file to S3 | $0.000005 (negligible) |
| S3 storage (1GB/month) | $0.023 |
| Bedrock KB ingestion (1000 chunks) | $0.10 |
| Titan Embed (1000 chunks) | $0.0001/token → ~$0.10 |
| OpenSearch index storage (1GB) | $0.24/month |
| Claude query with context (5 chunks) | $0.003/1k tokens → ~$0.015/query |

**Total for 100 documents + 1000 queries/month: ~$30-50**

---

## 📄 License

MIT — Built for educational institutions.

---

<div align="center">

Built with ❤️ on AWS · Powered by Amazon Bedrock

<br />

[![GitHub](https://img.shields.io/badge/GitHub-sethamedonu-181717?style=flat-square&logo=github)](https://github.com/sethamedonu)

</div>
