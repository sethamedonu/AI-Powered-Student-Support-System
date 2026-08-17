# Terraform Targeted Operations — Surgical Approach

## 🎯 What is "Targeted Resource Recreation"?

Instead of destroying EVERYTHING with `terraform destroy`, you can surgically **destroy and recreate specific resources** while leaving others intact.

---

## 🔍 Real-World Scenarios

### Scenario 1: "My API Gateway is broken, but I don't want to lose my data"

**Bad Approach (Full Destroy):**
```bash
terraform destroy  # ❌ Destroys EVERYTHING including data
```

**Good Approach (Targeted):**
```bash
# List what will be destroyed
terraform plan -destroy -target=module.api_gateway

# Destroy ONLY API Gateway
terraform destroy -target=module.api_gateway

# Recreate ONLY API Gateway
terraform apply -target=module.api_gateway
```

**Result:**
- ✅ New API Gateway created (new URL)
- ✅ DynamoDB data preserved
- ✅ Cognito users preserved
- ✅ Lambda functions untouched
- ⚠️ Just update frontend with new API URL

---

### Scenario 2: "I want to reset Lambda functions but keep all data"

```bash
# Destroy just Lambda module
terraform destroy -target=module.lambda

# Recreate Lambda functions
terraform apply -target=module.lambda

# Redeploy code
cd backend
npm run deploy
```

**Result:**
- ✅ All data intact
- ✅ Users can still log in
- ✅ Just Lambda functions recreated

---

### Scenario 3: "I messed up Cognito configuration"

```bash
# Destroy ONLY Cognito
terraform destroy -target=module.cognito

# Recreate Cognito
terraform apply -target=module.cognito
```

**Result:**
- ✅ DynamoDB data preserved
- ✅ S3 files preserved
- ❌ Users must re-register (but that's the only impact)

---

## 📊 Available Terraform Modules (Your Infrastructure)

Based on your `main.tf`, these are your targetable modules:

```bash
module.iam                # IAM roles and policies
module.dynamodb           # All DynamoDB tables
module.cognito            # User pool, client, groups
module.sqs                # SQS queues
module.sns                # SNS topics
module.ses                # Email service
module.bedrock            # AI guardrails, knowledge base
module.lambda             # All 22 Lambda functions
module.api_gateway        # API Gateway REST API
module.cloudwatch         # Logs, alarms, dashboards
module.amplify            # Frontend hosting
```

---

## 🛠️ Common Targeted Operations

### 1. **Recreate API Gateway Only**

**When to use:**
- API Gateway has wrong configuration
- Want different stage name
- CORS issues
- Authorizer problems

```bash
# See what will change
terraform plan -target=module.api_gateway

# Destroy + recreate in one command
terraform destroy -target=module.api_gateway && \
terraform apply -target=module.api_gateway
```

**Impact:**
- New API Gateway URL
- All data preserved
- Lambda functions unchanged
- Update frontend env vars

---

### 2. **Recreate Lambda Functions Only**

**When to use:**
- Lambda configuration drift
- Environment variables messed up
- IAM permissions issues

```bash
terraform destroy -target=module.lambda
terraform apply -target=module.lambda

# Don't forget to redeploy code!
cd backend
npm run deploy
```

**Impact:**
- Lambda functions recreated (empty)
- Must redeploy code
- All data preserved
- API Gateway unchanged

---

### 3. **Recreate Cognito Only**

**When to use:**
- User pool configuration wrong
- Password policy changes
- MFA settings issues

```bash
terraform destroy -target=module.cognito
terraform apply -target=module.cognito
```

**Impact:**
- New User Pool ID
- All users deleted (must re-register)
- DynamoDB data preserved
- Update frontend env vars

---

### 4. **Recreate DynamoDB Tables**

**⚠️ WARNING: This deletes all data!**

```bash
# Backup first!
aws dynamodb scan --table-name aisss-dev-users > backup-users.json

# Destroy specific table
terraform destroy -target=module.dynamodb.aws_dynamodb_table.users

# Recreate
terraform apply -target=module.dynamodb.aws_dynamodb_table.users
```

**Impact:**
- Table data lost (backup first!)
- Other tables untouched

---

### 5. **Recreate Amplify App Only**

**When to use:**
- Frontend deployment issues
- Environment variables wrong
- GitHub connection broken

```bash
terraform destroy -target=module.amplify
terraform apply -target=module.amplify
```

**Impact:**
- New Amplify App ID
- Triggers rebuild
- Backend unchanged

---

## 🎨 Advanced: Target Specific Resources

You can target **individual resources** within modules:

### List all resources
```bash
terraform state list
```

**Example output:**
```
module.api_gateway.aws_api_gateway_rest_api.main
module.api_gateway.aws_api_gateway_deployment.main
module.cognito.aws_cognito_user_pool.main
module.cognito.aws_cognito_user_pool_client.main
module.dynamodb.aws_dynamodb_table.users
module.dynamodb.aws_dynamodb_table.conversations
...
```

### Target specific resource
```bash
# Recreate JUST the REST API (not deployment, authorizer, etc.)
terraform destroy -target=module.api_gateway.aws_api_gateway_rest_api.main
terraform apply -target=module.api_gateway.aws_api_gateway_rest_api.main
```

---

## 🔄 The "Taint" Alternative

**"Tainting"** marks a resource for recreation without destroying it first.

### How it works:
```bash
# Mark API Gateway for recreation
terraform taint module.api_gateway.aws_api_gateway_rest_api.main

# Next apply will recreate it
terraform apply
```

**Benefit:** Terraform handles the recreation timing automatically.

---

## 📋 Decision Matrix: What Operation to Use?

| Problem | Full Destroy | Targeted Destroy | Taint | Manual Fix |
|---------|--------------|------------------|-------|------------|
| **API Gateway broken** | ❌ Overkill | ✅ Perfect | ✅ Good | ⚠️ Complex |
| **Lambda config wrong** | ❌ Overkill | ✅ Perfect | ✅ Good | ✅ Quick |
| **Cognito issues** | ❌ Overkill | ✅ Perfect | ✅ Good | ❌ Hard |
| **All data corrupted** | ⚠️ Maybe | ❌ Won't help | ❌ Won't help | ❌ Restore backup |
| **Testing new design** | ✅ OK for dev | ⚠️ Partial | ❌ No | ✅ New workspace |
| **IAM drift** | ❌ Overkill | ✅ Perfect | ✅ Good | ✅ Import |

---

## 💡 Real Example: Fixing Your API Tests Issue

**Problem:** API Gateway URL changed, tests failing.

**Option A: Full Destroy** ❌
```bash
terraform destroy                    # ❌ Destroys everything
terraform apply                      # Recreates all (2-4 hours)
# Lost: All data, users, everything
```

**Option B: Targeted** ✅
```bash
# Just get the current URL
terraform output api_gateway_invoke_url

# Update Postman environment manually
# No destruction needed!
```

**Option C: Recreate API Gateway** (if URL is really wrong)
```bash
terraform destroy -target=module.api_gateway
terraform apply -target=module.api_gateway

# Get new URL
NEW_URL=$(terraform output -raw api_gateway_invoke_url)

# Update frontend
aws amplify update-app --app-id dwfkamikpgffo \
  --environment-variables NEXT_PUBLIC_API_URL=$NEW_URL
```

---

## 🎯 Practical Workflow

### Step 1: Identify the Problem
```bash
# What's broken?
# - API Gateway? → Target module.api_gateway
# - Lambda? → Target module.lambda
# - Cognito? → Target module.cognito
```

### Step 2: Check What Will Change
```bash
terraform plan -target=module.<problematic_module>
```

### Step 3: Backup if Necessary
```bash
# If destroying data resources
aws dynamodb scan --table-name aisss-dev-users > backup.json
aws s3 sync s3://aisss-dev-knowledge-docs ./backup/
```

### Step 4: Targeted Destroy
```bash
terraform destroy -target=module.<problematic_module>
```

### Step 5: Recreate
```bash
terraform apply -target=module.<problematic_module>
```

### Step 6: Update Dependencies
```bash
# Get new values
terraform output

# Update frontend, Postman, etc.
```

---

## 📊 Impact Comparison

| Operation | Time | Data Loss | Downtime | Complexity |
|-----------|------|-----------|----------|------------|
| **Full destroy** | 2-4 hours | ⚠️ Total | ⚠️ 2-4 hours | Medium |
| **Targeted (API GW)** | 5-10 min | ✅ None | ⚠️ 5-10 min | Low |
| **Targeted (Lambda)** | 10-15 min | ✅ None | ⚠️ 10-15 min | Low |
| **Targeted (Cognito)** | 5-10 min | ⚠️ Users only | ⚠️ 5-10 min | Medium |
| **Targeted (DynamoDB)** | 5 min | ⚠️ That table | ⚠️ 5 min | Low |
| **Taint** | 5-15 min | Depends | ⚠️ 5-15 min | Low |

---

## 🚀 Pro Tips

### 1. **Use `-target` for Surgical Changes**
```bash
# Fix one thing, leave everything else alone
terraform destroy -target=module.api_gateway
terraform apply -target=module.api_gateway
```

### 2. **Chain Multiple Targets**
```bash
# Recreate API Gateway AND Lambda together
terraform destroy \
  -target=module.api_gateway \
  -target=module.lambda

terraform apply \
  -target=module.api_gateway \
  -target=module.lambda
```

### 3. **Always Preview First**
```bash
# See what will change
terraform plan -target=module.api_gateway
terraform plan -destroy -target=module.api_gateway
```

### 4. **Use Terraform Workspaces for Testing**
```bash
# Create test environment (isolated)
terraform workspace new test
terraform apply

# Test changes
# ...

# Switch back to dev
terraform workspace select dev

# Delete test
terraform workspace delete test
```

---

## ⚠️ Gotchas

### 1. **Dependencies**
Some resources depend on others. Destroying module A might require destroying module B.

**Example:**
```bash
# This might fail if Lambda depends on API Gateway
terraform destroy -target=module.api_gateway

# Error: module.lambda depends on module.api_gateway
# Solution: Destroy both
terraform destroy -target=module.api_gateway -target=module.lambda
```

### 2. **State Consistency**
After targeted operations, always run:
```bash
terraform plan  # Should show "No changes"
```

### 3. **Terraform Refresh**
Sometimes Terraform state is out of sync:
```bash
terraform refresh  # Sync state with AWS
```

---

## 📝 Summary

**Instead of destroying everything:**

1. **Identify** the specific broken module
2. **Target** just that module for destruction
3. **Recreate** only what's necessary
4. **Update** dependent configurations
5. **Save** hours of recovery time

**Example Command Structure:**
```bash
# Formula
terraform destroy -target=module.<module_name>
terraform apply -target=module.<module_name>

# Real example
terraform destroy -target=module.api_gateway
terraform apply -target=module.api_gateway
```

**Result:** Surgical fix, minimal impact, maximum speed! 🎯
