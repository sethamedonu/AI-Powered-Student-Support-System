# Terraform Destroy — Complete Impact Analysis

## 🔥 What `terraform destroy` Does

Running `terraform destroy` will **DELETE ALL AWS resources** managed by Terraform in your `dev` environment.

---

## ⚠️ CRITICAL: Data That Will Be PERMANENTLY LOST

### 1. **All DynamoDB Data** 💀
```
❌ aisss-dev-users              → All user accounts, profiles, roles
❌ aisss-dev-conversations      → All conversation history
❌ aisss-dev-messages           → All chat messages
❌ aisss-dev-cache              → All cached AI responses
❌ aisss-dev-analytics          → All usage analytics
❌ aisss-dev-feedback           → All user feedback
❌ aisss-dev-audit              → All audit logs
❌ aisss-dev-knowledge          → All knowledge base documents
```

**⚠️ DynamoDB tables have Point-in-Time Recovery (PITR) enabled**, but recovery is only available for 35 days. Once destroyed, you cannot recover data unless you have backups.

### 2. **All Cognito User Data** 💀
```
❌ User Pool: aisss-dev-user-pool
   - All 7 confirmed users will be deleted
   - All passwords, MFA settings
   - User attributes (email, name, role, studentId)
   - User groups (admin, student)
```

**⚠️ Users will need to re-register** and **all passwords will be reset**.

### 3. **S3 Knowledge Base Documents** 💀
```
❌ aisss-dev-knowledge-docs bucket
   - All uploaded PDF documents
   - Vector embeddings
   - Knowledge base content
```

**⚠️ S3 bucket versioning is enabled**, but once destroyed, you lose access to all versions.

### 4. **CloudWatch Logs** 💀
```
❌ All Lambda function logs
❌ API Gateway access logs
❌ Application metrics and dashboards
```

---

## ✅ What Will Be RECREATED (Infrastructure Only)

When you run `terraform plan` and `terraform apply` after destroy:

### 1. **IAM Roles & Policies** ✅
- Lambda execution role
- All IAM policies
- Service-to-service permissions

### 2. **DynamoDB Tables** ✅ (Empty)
- All 8 tables recreated with same schema
- **BUT: NO DATA** — tables will be empty
- Point-in-time recovery re-enabled
- Server-side encryption re-enabled

### 3. **Cognito User Pool** ✅ (Empty)
- New user pool with same configuration
- **BUT: Different User Pool ID** — frontend needs update
- **BUT: NO USERS** — all users must re-register
- Password policies, MFA settings recreated

### 4. **Lambda Functions** ✅
- All 22 Lambda functions recreated
- IAM permissions recreated
- Environment variables set
- **BUT: Code deployment is separate** — requires manual deploy

### 5. **API Gateway** ✅
- REST API recreated
- Cognito authorizer recreated
- **BUT: Different API Gateway ID** — new URL
- CORS settings applied

### 6. **SQS Queues** ✅
- Chat processing queue
- Dead letter queue (DLQ)
- **BUT: Any in-flight messages lost**

### 7. **SNS Topics** ✅
- Alert topic
- Email subscription recreated
- **BUT: Requires email confirmation again**

### 8. **S3 Buckets** ✅ (Empty)
- Knowledge docs bucket
- **BUT: NO FILES** — documents must be re-uploaded

### 9. **Bedrock Resources** ✅
- Guardrails recreated
- Knowledge base recreated
- **BUT: NO CONTENT** — must re-sync

### 10. **CloudWatch** ✅
- Log groups recreated
- Alarms recreated
- Dashboards recreated
- **BUT: NO HISTORICAL DATA**

### 11. **Amplify App** ✅
- Frontend app recreated
- GitHub connection restored
- **BUT: May have different app ID**
- Environment variables set

---

## 🛡️ What Will NOT Be Destroyed

### 1. **Bootstrap Resources** (Protected)
Located in `infrastructure/bootstrap/`:

```terraform
resource "aws_s3_bucket" "terraform_state" {
  lifecycle {
    prevent_destroy = true  # ← PROTECTED
  }
}
```

**These remain intact:**
✅ S3 bucket: `aisss-terraform-state-314175685812`
✅ DynamoDB table: `aisss-terraform-locks`
✅ Terraform state file: `dev/terraform.tfstate`

**Why?** These store Terraform's state. Without them, Terraform can't track resources.

### 2. **Resources Outside Terraform**
- **GitHub repository** — Not managed by Terraform
- **AWS account settings** — Not managed by Terraform
- **Route 53 hosted zones** (if created manually)
- **ACM certificates** (if created manually)
- **CloudWatch Logs** (may persist beyond resource deletion)

---

## 📊 Comparison: Before vs After Destroy

| Resource | Before Destroy | After Destroy | After Re-apply |
|----------|----------------|---------------|----------------|
| **Users** | 7 confirmed users | ❌ Deleted | 0 users (must re-register) |
| **Conversations** | All history | ❌ Deleted | Empty table |
| **Messages** | All chats | ❌ Deleted | Empty table |
| **Knowledge Docs** | All PDFs | ❌ Deleted | Empty bucket |
| **Cognito Pool ID** | us-east-1_PXvI63Kwg | ❌ Deleted | **NEW ID** (different) |
| **API Gateway URL** | 3qealfb0oi.execute-api... | ❌ Deleted | **NEW URL** (different) |
| **Lambda Functions** | All 22 deployed | ❌ Deleted | Created but **NO CODE** |
| **IAM Roles** | Configured | ❌ Deleted | Recreated (same config) |
| **CloudWatch Logs** | Historical data | ❌ Deleted | New empty logs |

---

## 🚨 Breaking Changes After Destroy + Recreate

### 1. **Frontend Will Break** 💔
```javascript
// Old environment variables (INVALID after destroy)
NEXT_PUBLIC_COGNITO_USER_POOL_ID = "us-east-1_PXvI63Kwg"  // ❌ No longer exists
NEXT_PUBLIC_API_URL = "https://3qealfb0oi.execute-api..."  // ❌ No longer exists
```

**Required Fix:**
- Update Amplify environment variables with NEW IDs
- Redeploy frontend

### 2. **Postman/API Tests Will Break** 💔
```json
// docs/api/environments/dev.json
{
  "BASE_URL": "https://3qealfb0oi..." // ❌ Old API Gateway URL
}
```

**Required Fix:**
- Update BASE_URL with new API Gateway URL

### 3. **Users Cannot Log In** 💔
- All user accounts deleted
- E2E test credentials invalid
- Users must re-register

**Required Fix:**
- Manually create test users in new Cognito pool
- Update E2E_TEST_USER_EMAIL/PASSWORD secrets

### 4. **Lambda Functions Won't Work** 💔
- Functions exist but have NO CODE (placeholder)

**Required Fix:**
- Run backend deployment script:
  ```bash
  cd backend
  npm run deploy
  ```

---

## 📋 Complete Recovery Procedure

If you destroy and want to recreate everything:

### Step 1: Backup Critical Data (BEFORE DESTROY)

```bash
# Backup DynamoDB tables
aws dynamodb scan --table-name aisss-dev-users > backup-users.json
aws dynamodb scan --table-name aisss-dev-conversations > backup-conversations.json
aws dynamodb scan --table-name aisss-dev-messages > backup-messages.json
aws dynamodb scan --table-name aisss-dev-knowledge > backup-knowledge.json

# Backup Cognito users
aws cognito-idp list-users --user-pool-id us-east-1_PXvI63Kwg > backup-cognito-users.json

# Backup S3 knowledge docs
aws s3 sync s3://aisss-dev-knowledge-docs ./backup-s3-docs/
```

### Step 2: Destroy

```bash
cd infrastructure/environments/dev
terraform destroy
```

### Step 3: Recreate Infrastructure

```bash
terraform plan
terraform apply
```

### Step 4: Deploy Lambda Code

```bash
cd ../../../backend
npm install
npm run build
npm run deploy
```

### Step 5: Update Frontend

```bash
# Get new values
NEW_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
NEW_API_URL=$(terraform output -raw api_gateway_invoke_url)

# Update Amplify environment variables
aws amplify update-app \
  --app-id dwfkamikpgffo \
  --environment-variables \
    NEXT_PUBLIC_COGNITO_USER_POOL_ID=$NEW_USER_POOL_ID \
    NEXT_PUBLIC_API_URL=$NEW_API_URL

# Trigger redeploy
aws amplify start-job --app-id dwfkamikpgffo --branch-name dev --job-type RELEASE
```

### Step 6: Recreate Users

```bash
# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id $NEW_USER_POOL_ID \
  --username "test@example.com" \
  --user-attributes Name=email,Value=test@example.com
```

### Step 7: Restore Data (Optional)

```bash
# Restore DynamoDB data
# (Custom script needed - complex process)

# Restore S3 files
aws s3 sync ./backup-s3-docs/ s3://aisss-dev-knowledge-docs/
```

### Step 8: Re-sync Knowledge Base

```bash
# Trigger knowledge base sync
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id $KB_ID \
  --data-source-id $DS_ID
```

---

## 🤔 When Should You Use `terraform destroy`?

### ✅ GOOD Reasons to Destroy:
1. **Switching AWS accounts**
2. **Major infrastructure refactoring** — testing new design
3. **Cost optimization** — decommissioning unused environment
4. **Security breach** — full environment rotation
5. **Development/testing** — temporary environments

### ❌ BAD Reasons to Destroy:
1. **"Just want to clean up"** — Use targeted resource cleanup instead
2. **"API Gateway URL changed"** — Can be updated without destroy
3. **"Having configuration issues"** — Debug first, destroy is last resort
4. **"Want fresh start"** — Consider targeted resource recreation

---

## 💡 Safer Alternatives to Full Destroy

### Option 1: Target Specific Resources
```bash
# Destroy only API Gateway
terraform destroy -target=module.api_gateway

# Recreate just API Gateway
terraform apply -target=module.api_gateway
```

### Option 2: Taint and Recreate
```bash
# Mark resource for recreation (keeps data if possible)
terraform taint module.api_gateway.aws_api_gateway_rest_api.main
terraform apply
```

### Option 3: Import Existing Resources
```bash
# If you manually created something, import it
terraform import module.cognito.aws_cognito_user_pool.main us-east-1_PXvI63Kwg
```

---

## 🎯 Summary

| Action | Impact | Recovery Time | Data Loss Risk |
|--------|--------|---------------|----------------|
| **terraform destroy** | Deletes ALL resources | 30-60 minutes | ⚠️ **HIGH** — All data lost |
| **terraform apply (after destroy)** | Recreates infrastructure only | 10-15 minutes | ⚠️ **HIGH** — Empty systems |
| **Full recovery** | Infrastructure + data + users | 2-4 hours | ⚠️ **MEDIUM** — If you have backups |

---

## ⚠️ Final Warning

**Before running `terraform destroy`:**

1. ✅ Backup all DynamoDB tables
2. ✅ Backup S3 knowledge documents  
3. ✅ Export Cognito user list
4. ✅ Document current Cognito Pool ID and API Gateway URL
5. ✅ Notify team/users of downtime
6. ✅ Understand you'll need 2-4 hours for full recovery
7. ✅ Confirm you have admin access to recreate everything

**If you're just testing or learning, create a separate Terraform workspace instead of destroying production!**

```bash
# Create test workspace (safer than destroying)
terraform workspace new test
terraform apply
```

---

**Date Created**: 2026-08-17  
**Your Environment**: `dev` (development)  
**Current Resources**: ~50 AWS resources managed by Terraform
