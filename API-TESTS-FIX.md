# API Tests Failure - Root Cause & Fix

## 🔴 Problem Summary

The API Tests pipeline has been failing consistently since inception with the error:
```
GET https://api-dev.yourdomain.com/health [errored]
Hostname/IP does not match certificate's altnames
```

## 🔍 Root Cause

The Postman environment file (`docs/api/environments/dev.json`) contained **placeholder values** instead of the actual API Gateway URL:

### ❌ Before (Incorrect):
```json
{
  "BASE_URL": "https://api-dev.yourdomain.com",
  "TEST_EMAIL": "testuser@yourdomain.com",
  "TEST_PASSWORD": "REPLACE_WITH_SECRET"
}
```

### ✅ After (Fixed):
```json
{
  "BASE_URL": "https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev",
  "TEST_EMAIL": "setnetnetworks@gmail.com",
  "TEST_PASSWORD": "REPLACE_WITH_ACTUAL_PASSWORD"
}
```

## 🛠️ What Was Fixed

### 1. Updated BASE_URL
- **Old**: `https://api-dev.yourdomain.com` (placeholder/invalid)
- **New**: `https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev` (actual API Gateway)

### 2. Updated TEST_EMAIL
- **Old**: `testuser@yourdomain.com` (doesn't exist in Cognito)
- **New**: `setnetnetworks@gmail.com` (confirmed Cognito user)

### 3. TEST_PASSWORD Still Needs Configuration
- The password is stored as a **GitHub Secret** for security
- Variable name: `API_TEST_PASSWORD`
- Must be configured in GitHub repository settings

## ⚙️ How to Complete the Fix

### ✅ ALREADY DONE: GitHub Secrets Configured

The E2E test secrets are already configured and will be reused:
- `E2E_TEST_USER_EMAIL` - Configured since 2026-07-28
- `E2E_TEST_USER_PASSWORD` - Configured since 2026-07-28

**No additional secret configuration needed!**

### ✅ ALREADY DONE: Workflow Updated

The workflow has been updated to:
1. Read the existing E2E test secrets
2. Inject them into the Postman environment file at runtime
3. Run Newman with the updated credentials

### Changes Made:

**1. Environment File** (`docs/api/environments/dev.json`):
```json
{
  "TEST_EMAIL": "INJECTED_FROM_SECRET",
  "TEST_PASSWORD": "INJECTED_FROM_SECRET"
}
```

**2. Workflow** (`.github/workflows/api-tests.yml`):
```yaml
- name: Run API tests
  env:
    TEST_USER_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  run: |
    # Inject secrets into environment file at runtime
    jq --arg email "$TEST_USER_EMAIL" --arg password "$TEST_USER_PASSWORD" \
      '.values |= map(
        if .key == "TEST_EMAIL" then .value = $email
        elif .key == "TEST_PASSWORD" then .value = $password
        else . end
      )' docs/api/environments/dev.json > temp.json
    mv temp.json docs/api/environments/dev.json
    
    newman run docs/api/aisss-api-collection.json \
      --environment docs/api/environments/dev.json \
      --reporters cli,htmlextra \
      --reporter-htmlextra-export newman-report.html \
      --bail
```

### How It Works:

1. Workflow loads secrets from GitHub
2. Uses `jq` to inject email and password into environment file
3. Newman runs with the dynamically updated environment
4. Secrets never get committed to git

**Staging** (`docs/api/environments/staging.json`):
```json
{
  "name": "AISSS — Staging",
  "values": [
    { "key": "BASE_URL", "value": "https://YOUR_STAGING_API_URL", "enabled": true },
    { "key": "TEST_EMAIL", "value": "staging-test@gmail.com", "enabled": true },
    { "key": "TEST_PASSWORD", "value": "REPLACE_WITH_STAGING_PASSWORD", "enabled": true }
  ]
}
```

**Production** (`docs/api/environments/prod.json`):
```json
{
  "name": "AISSS — Production",
  "values": [
    { "key": "BASE_URL", "value": "https://YOUR_PROD_API_URL", "enabled": true },
    { "key": "TEST_EMAIL", "value": "prod-test@gmail.com", "enabled": true },
    { "key": "TEST_PASSWORD", "value": "REPLACE_WITH_PROD_PASSWORD", "enabled": true }
  ]
}
```

## 📊 Expected Results After Fix

Once the fix is complete, the API tests should:

✅ Successfully connect to the API Gateway  
✅ Run health check endpoint  
✅ Test authentication endpoints  
✅ Test all API endpoints defined in the Postman collection  
✅ Generate HTML report with detailed results  

## 🧪 Testing the Fix

### Option 1: Manual Trigger (Recommended)

```bash
# Trigger API tests workflow
gh workflow run api-tests.yml -f environment=dev
```

### Option 2: Wait for Scheduled Run

The workflow runs automatically daily at 6:00 AM UTC.

### Option 3: Test Locally with Newman

```bash
# Install Newman
npm install -g newman newman-reporter-htmlextra

# Run tests locally (after updating dev.json with password)
newman run docs/api/aisss-api-collection.json \
  --environment docs/api/environments/dev.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export newman-report.html
```

## 📋 Verification Checklist

- [x] ✅ Updated BASE_URL to actual API Gateway URL
- [x] ✅ Updated TEST_EMAIL to use E2E test secret
- [x] ✅ Updated TEST_PASSWORD to use E2E test secret
- [x] ✅ E2E secrets already configured in GitHub
- [x] ✅ Updated workflow to inject credentials at runtime
- [ ] ⚠️ Test API tests workflow manually
- [ ] ⚠️ Verify all API tests pass

## 🔐 Security Best Practices

### ✅ DO:
- Store passwords in GitHub Secrets
- Use environment variables for sensitive data
- Rotate test user passwords regularly
- Use dedicated test accounts (not admin accounts)

### ❌ DON'T:
- Commit passwords to git
- Use production credentials for testing
- Share test credentials publicly
- Hardcode sensitive data in environment files

## 📚 Additional Information

### Available Test Users (from Cognito)

Choose one for testing:
1. `setnetnetworks@gmail.com` ✅ (Currently configured)
2. `reennhyira85@gmail.com`
3. `fred.testing.app@gmail.com`
4. `setnet.test@zohomail.com`
5. `domprehdoreenappiah@gmail.com`
6. `sethkelvin3@gmail.com`
7. `terrence.binful@azubiafrica.org`

### API Gateway Details

- **API ID**: `3qealfb0oi`
- **Region**: `us-east-1`
- **Stage**: `dev`
- **Full URL**: `https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev`

### Postman Collection Location

- **Collection**: `docs/api/aisss-api-collection.json`
- **Environments**: `docs/api/environments/*.json`

## 🎯 Next Steps

1. **Commit this fix**:
   ```bash
   git add docs/api/environments/dev.json
   git commit -m "fix: update Postman dev environment with correct API Gateway URL"
   git push
   ```

2. **Configure password secret**:
   - Go to GitHub repository settings
   - Add `API_TEST_PASSWORD` secret

3. **Update workflow** (see Step 2 above)

4. **Test manually**:
   ```bash
   gh workflow run api-tests.yml -f environment=dev
   ```

5. **Monitor results**:
   ```bash
   gh run list --workflow=api-tests.yml --limit 1
   gh run watch <run-id>
   ```

---

**Status**: 🟡 Partially Fixed  
**Action Required**: Configure password secret and update workflow  
**Priority**: Medium (API tests are optional but valuable for CD validation)  
**Date**: 2026-08-17
