# Current Issues and Fixes

## Issue 1: Promote/Demote Not Working

### Symptoms
- User clicks "Promote" or "Demote" button
- Confirmation dialog appears
- User confirms
- Nothing happens or error occurs
- Role doesn't change in UI

### Root Causes Identified

#### 1. **Possible Cognito User Pool Mismatch**
The Lambda uses `existing.email` as the Cognito username, but Cognito might be using the `sub` (user ID) as the username instead.

**Check:**
```bash
aws cognito-idp list-users --user-pool-id <POOL_ID> --limit 5
```

Look at the `Username` field - is it an email or a UUID?

#### 2. **Missing Cognito Groups**
The Lambda tries to add users to `Administrators` and `Students` groups, but these groups might not exist in Cognito.

**Check:**
```bash
aws cognito-idp list-groups --user-pool-id <POOL_ID>
```

Expected output:
```json
{
  "Groups": [
    { "GroupName": "Administrators", ... },
    { "GroupName": "Students", ... }
  ]
}
```

#### 3. **IAM Permissions Issue**
The Lambda execution role might not have permission to call Cognito AdminAddUserToGroup / AdminRemoveUserFromGroupUser.

**Check CloudWatch Logs:**
```bash
aws logs tail /aws/lambda/aisss-dev-admin-users-update --since 1h
```

Look for errors like:
- `AccessDeniedException`
- `UserNotFoundException`
- `ResourceNotFoundException` (group doesn't exist)

### Solution 1: Fix Cognito Username Resolution

Update `backend/src/functions/admin/updateUser.ts`:

```typescript
// Get the actual Cognito username (might be sub, not email)
const cognitoUser = await cognito.send(
  new AdminGetUserCommand({
    UserPoolId: env.COGNITO_USER_POOL_ID,
    Username: existing.userId, // Try user ID first
  }),
).catch(() => 
  cognito.send(
    new AdminGetUserCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: existing.email, // Fallback to email
    }),
  )
);

const username = cognitoUser.Username;
```

### Solution 2: Create Missing Cognito Groups

Run Terraform to create the groups:

**File: `infrastructure/modules/cognito/groups.tf`**
```hcl
resource "aws_cognito_user_group" "administrators" {
  name         = "Administrators"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Admin users with full access"
  precedence   = 1
}

resource "aws_cognito_user_group" "students" {
  name         = "Students"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Regular student users"
  precedence   = 2
}
```

Then apply:
```bash
cd infrastructure/environments/dev
terraform apply
```

### Solution 3: Make Role Management Work Without Cognito Groups

Alternative approach - just update DynamoDB and skip Cognito group management:

```typescript
// Simplified approach - just update DynamoDB
const updated = await repo.update(userId, updates);

// Log what would have been done
if (updates.role && updates.role !== existing.role) {
  logger.info('Role change recorded in DynamoDB', {
    userId,
    oldRole: existing.role,
    newRole: updates.role,
    note: 'Cognito group sync skipped - role managed in DynamoDB only',
  });
}

return successResponse(updated, 200, requestId);
```

---

## Issue 2: Document Upload "Network Error"

### Symptoms
- Admin selects a PDF file
- Upload progress starts
- Error: "Network error during upload"
- File never reaches S3

### Root Cause
**S3 bucket missing CORS configuration**

When the browser tries to PUT the file directly to S3 using the pre-signed URL, S3 blocks it because:
1. The request is cross-origin (from `https://dev.dwfkamikpgffo.amplifyapp.com` to `https://s3.amazonaws.com`)
2. S3 bucket has no CORS policy allowing PUT requests from that origin
3. Browser blocks the request due to CORS policy

### Solution: Add CORS Configuration to S3 Bucket

#### Option A: Add to Terraform (Recommended)

**File: `infrastructure/modules/s3/main.tf`** (or wherever the knowledge docs bucket is defined)

```hcl
resource "aws_s3_bucket" "knowledge_docs" {
  bucket = "${var.project_name}-${var.environment}-knowledge-docs"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-knowledge-docs"
    Environment = var.environment
  }
}

# Add CORS configuration
resource "aws_s3_bucket_cors_configuration" "knowledge_docs" {
  bucket = aws_s3_bucket.knowledge_docs.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = [
      "https://dev.dwfkamikpgffo.amplifyapp.com",
      "https://staging.dwfkamikpgffo.amplifyapp.com",  # If you have staging
      "https://dwfkamikpgffo.amplifyapp.com",          # Production
      "http://localhost:5173",                          # Local dev
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
```

Then apply:
```bash
cd infrastructure/environments/dev
terraform plan
terraform apply
```

#### Option B: Add via AWS CLI (Quick Fix)

```bash
# Get the bucket name
BUCKET_NAME="aisss-dev-knowledge-docs"

# Create CORS configuration file
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT", "POST", "GET"],
      "AllowedOrigins": [
        "https://dev.dwfkamikpgffo.amplifyapp.com",
        "http://localhost:5173"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file://cors-config.json

# Verify
aws s3api get-bucket-cors --bucket $BUCKET_NAME
```

### Verification Steps

1. **Check CORS is applied:**
```bash
aws s3api get-bucket-cors --bucket aisss-dev-knowledge-docs
```

2. **Test with curl:**
```bash
# Get upload URL from Lambda
TOKEN="<your-admin-token>"
UPLOAD_RESPONSE=$(curl -X POST \
  https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.pdf","contentType":"application/pdf"}')

UPLOAD_URL=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadUrl')

# Test CORS preflight
curl -X OPTIONS "$UPLOAD_URL" \
  -H "Origin: https://dev.dwfkamikpgffo.amplifyapp.com" \
  -H "Access-Control-Request-Method: PUT" \
  -v

# Should see:
# < Access-Control-Allow-Origin: https://dev.dwfkamikpgffo.amplifyapp.com
# < Access-Control-Allow-Methods: PUT, POST, GET
```

3. **Test upload with the debug script:**
```bash
node debug-document-upload.js
```

---

## Testing Scripts

### Test User Update

```bash
# This will fail until Cognito groups exist or code is updated
node test-user-update.js admin@test.com <correct-password> <userId> admin
```

### Test Document Upload

```bash
# Create test script
node -e "
const API_BASE = 'https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev';

async function test() {
  // Login (use correct credentials)
  const loginRes = await fetch(\`\${API_BASE}/auth/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'YourActualPassword' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.tokens.idToken;

  // Get upload URL
  const uploadRes = await fetch(\`\${API_BASE}/admin/documents/upload\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`,
    },
    body: JSON.stringify({
      fileName: 'test.pdf',
      contentType: 'application/pdf',
      folder: 'uploads',
    }),
  });
  const uploadData = await uploadRes.json();
  console.log('Upload URL received:', uploadData.data.uploadUrl.substring(0, 80));

  // Upload dummy PDF
  const dummyPdf = Buffer.from('%PDF-1.4\n%%EOF');
  const s3Res = await fetch(uploadData.data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: dummyPdf,
  });

  console.log('S3 upload status:', s3Res.status, s3Res.statusText);
  if (s3Res.ok) {
    console.log('✅ Upload successful!');
  } else {
    console.log('❌ Upload failed');
    console.log('Response:', await s3Res.text());
  }
}

test().catch(console.error);
"
```

---

## Quick Fixes Summary

### For Promote/Demote:

**Option 1: Create Cognito Groups** (Recommended)
```bash
aws cognito-idp create-group \
  --group-name Administrators \
  --user-pool-id <YOUR_POOL_ID> \
  --description "Admin users"

aws cognito-idp create-group \
  --group-name Students \
  --user-pool-id <YOUR_POOL_ID> \
  --description "Student users"
```

**Option 2: Skip Cognito Sync** (Simplest)
- Update Lambda to only modify DynamoDB
- Remove all Cognito group operations
- Role is managed in DynamoDB only

### For Document Upload:

**Apply S3 CORS immediately:**
```bash
aws s3api put-bucket-cors \
  --bucket aisss-dev-knowledge-docs \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["PUT","POST","GET"],
      "AllowedOrigins": ["https://dev.dwfkamikpgffo.amplifyapp.com","http://localhost:5173"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }]
  }'
```

---

## Next Steps

1. **Identify actual admin credentials** - The `admin@test.com / Admin123!` doesn't seem to work
2. **Check Cognito configuration** - List users and groups to understand current state
3. **Apply S3 CORS fix** - Either via Terraform or AWS CLI
4. **Test both functionalities** - Use the debug scripts provided
5. **Update documentation** - Document the actual admin credentials and setup process

Let me know which approach you'd like to take for each issue!
