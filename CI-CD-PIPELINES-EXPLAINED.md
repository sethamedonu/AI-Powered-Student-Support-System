# CI/CD Pipelines Explained

## Overview

Your AI-Powered Student Support System has **4 distinct CI/CD pipelines** that automate testing, deployment, and quality assurance. Here's a complete breakdown:

---

## 1. 🔍 CI Pipeline - Lint, Test & Build

**File**: `.github/workflows/ci.yml`  
**Purpose**: Continuous Integration - Code quality and correctness validation  
**Triggers**: 
- Push to `main` or `dev` branches
- Pull requests to `main` or `dev` branches

### What It Does:

This is your **primary quality gate**. Every code change goes through these checks before being merged or deployed.

#### 🔧 Backend Job
**Duration**: ~40 seconds

Validates the backend (Lambda functions):
1. **Lint** - ESLint checks for code style violations
2. **Type Check** - TypeScript compiler validates types
3. **Unit Tests** - Runs all backend unit tests with coverage
4. **Build** - Compiles TypeScript to JavaScript

**Outputs**:
- Backend coverage report (uploaded as artifact)
- Build artifacts

#### 🎨 Frontend Job
**Duration**: ~53 seconds

Validates the frontend (Next.js app):
1. **Lint** - ESLint + Next.js linting rules
2. **Type Check** - TypeScript validation
3. **Unit Tests** - React component tests
4. **Build** - Next.js production build

**Environment Variables** (placeholder values for build):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_COGNITO_REGION`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`

#### 🏗️ Terraform Job
**Duration**: ~25 seconds

Validates infrastructure-as-code:
1. **Format Check** - Ensures Terraform files are properly formatted
2. **Init & Validate (Bootstrap)** - Validates Terraform state backend setup
3. **Init & Validate (Dev)** - Validates dev environment configuration

#### 🔒 Security Job
**Duration**: ~27 seconds

Scans for security vulnerabilities:
1. **Trivy Scan** - Scans filesystem for:
   - Dependency vulnerabilities (npm packages)
   - Configuration issues
   - Critical and high severity issues
2. **Upload SARIF** - Results uploaded to GitHub Security tab

### Key Features:
- **Concurrency Control**: Cancels in-progress runs when new commits are pushed
- **Parallel Execution**: All 4 jobs run simultaneously
- **Fast Feedback**: Completes in ~1 minute
- **Quality Gates**: Must pass before merge

### When It Runs:
```
Push to main/dev → CI Pipeline → ✅ Pass → Code is safe to deploy
                                → ❌ Fail → Prevents merge/deployment
```

---

## 2. 🚀 Deploy Pipeline - Infrastructure & Backend

**File**: `.github/workflows/deploy.yml`  
**Purpose**: Continuous Deployment - Automated infrastructure and backend deployment  
**Triggers**: 
- Push to `main` or `dev` branches (auto-deploys to dev)
- Manual workflow dispatch (can target dev or prod, choose plan/apply)

### What It Does:

This pipeline **deploys your entire backend infrastructure and code** to AWS.

#### 📋 Setup Job

Determines target environment:
- **Automatic**: 
  - Push to `dev` → deploys to dev environment
  - Push to `main` → deploys to dev environment (until prod is ready)
- **Manual**: Choose environment (dev/prod) and action (plan/apply)

#### 🏗️ Infrastructure Job (Terraform)
**Dependencies**: Requires Setup job  
**Environment**: Uses GitHub environment secrets

Manages AWS infrastructure:
1. **Terraform Init** - Initializes Terraform backend (S3 + DynamoDB)
2. **Terraform Plan** - Previews infrastructure changes
3. **Terraform Apply** - Creates/updates AWS resources:
   - API Gateway
   - Lambda function configurations
   - DynamoDB tables
   - SQS queues
   - Cognito User Pool
   - IAM roles and policies
   - CloudWatch log groups

**Required Secrets**:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `GH_ACCESS_TOKEN`
- `DOMAIN`
- `SES_FROM_EMAIL`
- `ALERT_EMAIL`

#### 🔧 Backend Job (Lambda Deployment)
**Dependencies**: Requires Setup + Infrastructure jobs  
**Duration**: ~2-5 minutes

Deploys Lambda functions:
1. **Install Dependencies** - `npm install`
2. **Build** - Compiles TypeScript
3. **Run Unit Tests** - Final validation before deploy
4. **Deploy Lambda Functions** - Runs custom deploy script:
   - Bundles each Lambda function with dependencies
   - Creates .zip files for all 22 functions
   - Uploads to AWS Lambda via AWS SDK
5. **Redeploy API Gateway** - Creates new API Gateway deployment stage

**Lambda Functions Deployed** (22 total):
```
Authentication:
  - aisss-dev-auth-login
  - aisss-dev-auth-refresh
  - aisss-dev-auth-register
  - aisss-dev-auth-verify
  - aisss-dev-auth-forgot-password
  - aisss-dev-auth-reset-password

Chat:
  - aisss-dev-chat-send-message

Conversations:
  - aisss-dev-conversations-list
  - aisss-dev-conversations-get
  - aisss-dev-conversations-delete

Feedback:
  - aisss-dev-feedback-submit

Analytics:
  - aisss-dev-analytics-get

Admin:
  - aisss-dev-admin-analytics
  - aisss-dev-admin-stats
  - aisss-dev-admin-list-users
  - aisss-dev-admin-update-user
  - aisss-dev-admin-list-feedback
  - aisss-dev-admin-upsert-knowledge
  - aisss-dev-admin-sync-knowledge
  - aisss-dev-admin-search-knowledge
  - aisss-dev-admin-delete-knowledge

Health:
  - aisss-dev-health
```

### Deployment Flow:
```
Push to main/dev → Setup → Infrastructure (Terraform)
                                ↓
                          Backend (Lambda + API Gateway)
                                ↓
                          ✅ Deployed to AWS
```

### Key Features:
- **Environment Isolation**: Separate dev/prod configurations
- **Terraform State Locking**: Prevents concurrent modifications
- **Rollback Safety**: Terraform tracks state, can rollback if needed
- **Notification**: Success/failure messages

---

## 3. 🧪 API Tests Pipeline - Newman (Postman)

**File**: `.github/workflows/api-tests.yml`  
**Purpose**: Automated API testing using Postman collections  
**Triggers**: 
- Manual workflow dispatch (choose dev or prod)
- Scheduled daily at 6:00 AM UTC

### What It Does:

Runs **end-to-end API tests** against your deployed environment using Newman (Postman CLI).

#### Test Execution:
1. **Install Newman** - Postman CLI runner + HTML reporter
2. **Run API Tests** - Executes Postman collection:
   - Loads collection: `docs/api/aisss-api-collection.json`
   - Loads environment: `docs/api/environments/{env}.json`
   - Tests all API endpoints
   - Validates responses
   - Checks authentication flows
3. **Generate Report** - HTML report with detailed results
4. **Upload Report** - Available as artifact for 7 days

**Test Coverage** (based on Postman collection):
- Health checks
- Authentication endpoints
- Chat endpoints
- Conversation management
- Feedback submission
- Admin operations
- Analytics endpoints

### Key Features:
- **Environment Selection**: Test against dev or prod
- **Bail on Failure**: Stops at first failure for fast feedback
- **Scheduled Runs**: Daily smoke tests ensure uptime
- **HTML Reports**: Visual test results with request/response details

### When to Use:
- **Manual**: Before major releases to validate API
- **Scheduled**: Daily health checks
- **After Deploy**: Verify deployment succeeded

---

## 4. 🎭 E2E Tests Pipeline - Playwright

**File**: `.github/workflows/e2e.yml`  
**Purpose**: End-to-end browser automation testing  
**Triggers**: 
- Manual workflow dispatch only (specify base URL)

### What It Does:

Runs **full browser-based tests** simulating real user interactions.

#### Test Execution:
1. **Install Dependencies** - Frontend dependencies
2. **Install Playwright Browsers** - Chromium and Firefox
3. **Run Playwright Tests** - Executes E2E test suite:
   - Login flows
   - Chat interactions
   - Navigation testing
   - Form submissions
   - Admin operations
4. **Generate Report** - Playwright HTML report
5. **Upload Report** - Available as artifact for 7 days

**Test Environment Variables**:
- `BASE_URL` - Target environment URL
- `TEST_USER_EMAIL` - Test user credentials
- `TEST_USER_PASSWORD` - Test user password

### Browsers Tested:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox

### Key Features:
- **Manual Only**: Prevents unnecessary runs (tests take ~10-30 min)
- **Multi-Browser**: Tests across different browsers
- **Real User Simulation**: Clicks, types, navigates like actual users
- **Visual Reports**: Screenshots and videos on failure

### Test Coverage (when implemented):
- User authentication flow
- Chat functionality
- Conversation history
- Feedback submission
- Admin dashboard
- Responsive design
- Accessibility checks

---

## 📊 Pipeline Comparison

| Pipeline | Frequency | Duration | Purpose | Cost |
|----------|-----------|----------|---------|------|
| **CI** | Every push/PR | ~1 min | Code quality | Free (GitHub Actions) |
| **Deploy** | Push to main/dev | ~5 min | Infrastructure + Backend deployment | AWS resources |
| **API Tests** | Manual + Daily | ~2 min | API validation | Free (minimal compute) |
| **E2E** | Manual only | ~30 min | Full user flows | Free (but time-consuming) |

---

## 🔄 Complete CI/CD Flow

Here's how all pipelines work together:

### Development Workflow:
```
1. Developer pushes code to dev branch
   ↓
2. CI Pipeline runs automatically
   ├─ Backend: Lint → Type Check → Test → Build ✅
   ├─ Frontend: Lint → Type Check → Test → Build ✅
   ├─ Terraform: Format → Validate ✅
   └─ Security: Trivy Scan ✅
   ↓
3. Deploy Pipeline runs automatically (if CI passed)
   ├─ Terraform: Plan → Apply (infrastructure)
   ├─ Backend: Build → Test → Deploy (22 Lambda functions)
   └─ API Gateway: Redeploy stage
   ↓
4. Amplify automatically deploys frontend (separate service)
   └─ Next.js: Build → Deploy to CDN
   ↓
5. (Optional) API Tests run manually or scheduled
   └─ Newman: Execute Postman collection → Generate report
   ↓
6. (Optional) E2E Tests run manually before release
   └─ Playwright: Browser automation → Generate report
```

### Production Release:
```
1. Merge dev → main (via Pull Request)
   ↓
2. CI Pipeline validates main branch
   ↓
3. Deploy Pipeline deploys to dev (main currently targets dev)
   ↓
4. Run API Tests manually against dev
   ↓
5. Run E2E Tests manually against dev
   ↓
6. When ready for prod:
   - Manually trigger Deploy workflow
   - Select environment: prod
   - Select action: plan → review → apply
```

---

## 🛠️ Pipeline Management

### Monitoring Pipelines:

**GitHub Actions UI**:
```
Repository → Actions → Select workflow
```

**CLI (gh)**:
```bash
# List recent runs
gh run list --branch main --limit 10

# Watch a specific run
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Manually Trigger Workflows:

**Deploy Workflow**:
```bash
gh workflow run deploy.yml \
  -f environment=dev \
  -f action=plan
```

**API Tests**:
```bash
gh workflow run api-tests.yml \
  -f environment=dev
```

**E2E Tests**:
```bash
gh workflow run e2e.yml \
  -f base_url=https://dev.dwfkamikpgffo.amplifyapp.com
```

---

## 📋 Pipeline Requirements

### Secrets Configuration:

Your pipelines require these GitHub secrets:

**AWS Access**:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (us-east-1)

**Terraform Variables**:
- `GH_ACCESS_TOKEN` - GitHub personal access token
- `DOMAIN` - Application domain
- `SES_FROM_EMAIL` - Email for SES
- `ALERT_EMAIL` - Email for alerts

**E2E Testing** (optional):
- `E2E_TEST_USER_EMAIL` - Test user email
- `E2E_TEST_USER_PASSWORD` - Test user password

### Environment Setup:

**GitHub Environments**:
- `dev` - Development environment
- `prod` - Production environment (future)

Each environment can have:
- Environment-specific secrets
- Deployment protection rules
- Reviewers

---

## 🎯 Best Practices

### When to Run Each Pipeline:

| Scenario | Run This |
|----------|----------|
| **Every commit** | CI (automatic) |
| **Deploy to dev** | Deploy (automatic on push) |
| **Before release** | API Tests + E2E Tests (manual) |
| **Daily health check** | API Tests (scheduled) |
| **Production deploy** | All pipelines (manual trigger) |

### Pipeline Optimization:

1. **CI Pipeline**: Runs fast (~1 min) - always passes before deploy
2. **Deploy Pipeline**: Only runs after CI passes
3. **API Tests**: Run after deploy to verify
4. **E2E Tests**: Run before major releases only (time-consuming)

### Handling Failures:

**CI Fails**:
- Fix code quality issues locally
- Run `npm run lint` and `npm run test` locally
- Push fix → CI reruns automatically

**Deploy Fails**:
- Check Terraform state lock (wait or force unlock)
- Verify AWS credentials
- Check logs: `gh run view <run-id> --log-failed`

**API Tests Fail**:
- Check if backend deployed correctly
- Verify API Gateway stage
- Review Newman HTML report

**E2E Tests Fail**:
- Check Playwright screenshots/videos
- Verify test credentials
- Test manually in browser

---

## 🚦 Current Status

Based on recent runs:

✅ **CI Pipeline**: PASSING (all jobs green)  
✅ **Deploy Pipeline**: OPERATIONAL (successfully deployed 22 Lambda functions)  
⚠️ **API Tests**: Not configured (Postman collection needed)  
⚠️ **E2E Tests**: Not configured (Playwright tests needed)

### Next Steps:

1. ✅ CI and Deploy are fully operational
2. ⚠️ Create Postman collection for API tests
3. ⚠️ Write Playwright tests for E2E
4. 📝 Configure E2E test user credentials

---

## 📚 Additional Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws
- **Newman Docs**: https://learning.postman.com/docs/running-collections/using-newman-cli
- **Playwright Docs**: https://playwright.dev/

---

**Last Updated**: 2026-08-07  
**Pipeline Version**: All workflows use Node.js 22, Terraform 1.9.0
