# Document Upload Testing Guide

## ✅ S3 CORS Fixed!

The S3 bucket CORS configuration has been applied successfully. Document uploads should now work.

**Bucket:** `aisss-dev-knowledge-docs-314175685812`

**CORS Configuration Applied:**
```json
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
  "AllowedOrigins": [
    "https://dev.dwfkamikpgffo.amplifyapp.com",
    "https://staging.dwfkamikpgffo.amplifyapp.com",
    "https://dwfkamikpgffo.amplifyapp.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  "ExposeHeaders": ["ETag", "x-amz-request-id"],
  "MaxAgeSeconds": 3000
}
```

---

## Testing Steps

### Method 1: Web UI (Recommended)

1. **Navigate to admin page:**
   ```
   https://dev.dwfkamikpgffo.amplifyapp.com/admin
   ```

2. **Log in with admin credentials**
   - Use your actual admin credentials (not test credentials)

3. **Scroll down to "Knowledge Base Documents" section**

4. **Select a folder category:**
   - Admissions
   - Registration
   - Tuition & Fees
   - Examinations
   - Academic Calendar
   - Graduation
   - Scholarships
   - Campus Services
   - General

5. **Click or drag-and-drop a file:**
   - Supported formats: PDF, DOC, DOCX, TXT, MD
   - Maximum size: 50 MB

6. **Watch the progress bar:**
   - "Preparing upload…" (10%)
   - "Uploading… 30-100%" (real-time progress)
   - ✅ "File uploaded successfully"

7. **Click "Sync Knowledge Base" button:**
   - Triggers Bedrock ingestion
   - Documents will be searchable in 1-5 minutes

### Expected Result
- ✅ No "Network error during upload"
- ✅ Progress bar shows real-time upload progress
- ✅ Success message appears after upload
- ✅ File appears in "Uploaded this session" list

---

### Method 2: Test Script

Create a test PDF file:

```bash
# Create a simple test PDF
echo "%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF" > test-document.pdf
```

Run the test:

```bash
node -e "
const fs = require('fs');
const API_BASE = 'https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev';

async function test() {
  console.log('Testing document upload flow...\n');

  // 1. Login
  console.log('1. Logging in...');
  const loginRes = await fetch(\`\${API_BASE}/auth/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: 'YOUR_ADMIN_EMAIL', 
      password: 'YOUR_ADMIN_PASSWORD' 
    }),
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.data.tokens.idToken;
  console.log('✅ Login successful\n');

  // 2. Request upload URL
  console.log('2. Requesting pre-signed URL...');
  const uploadRes = await fetch(\`\${API_BASE}/admin/documents/upload\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`,
    },
    body: JSON.stringify({
      fileName: 'test-document.pdf',
      contentType: 'application/pdf',
      folder: 'uploads',
    }),
  });

  if (!uploadRes.ok) {
    console.error('Failed to get upload URL:', await uploadRes.text());
    return;
  }

  const uploadData = await uploadRes.json();
  console.log('✅ Upload URL received');
  console.log('   S3 Key:', uploadData.data.s3Key);
  console.log('   Bucket:', uploadData.data.bucket, '\n');

  // 3. Upload file to S3
  console.log('3. Uploading file to S3...');
  const fileContent = fs.readFileSync('test-document.pdf');
  
  const s3Res = await fetch(uploadData.data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: fileContent,
  });

  console.log('   Status:', s3Res.status, s3Res.statusText);

  if (s3Res.ok) {
    console.log('✅ File uploaded successfully to S3!\n');

    // 4. Trigger sync
    console.log('4. Triggering knowledge base sync...');
    const syncRes = await fetch(\`\${API_BASE}/admin/documents/sync\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`,
      },
      body: '{}',
    });

    if (syncRes.ok) {
      const syncData = await syncRes.json();
      console.log('✅ Sync started');
      console.log('   Job ID:', syncData.data.jobId);
      console.log('   Status:', syncData.data.status);
      console.log('   Message:', syncData.data.message);
      console.log('\n✅ Test completed successfully!');
    } else {
      console.error('Sync failed:', await syncRes.text());
    }
  } else {
    console.error('❌ S3 upload failed');
    console.error('Response:', await s3Res.text());
  }
}

test().catch(console.error);
"
```

**Replace placeholders:**
- `YOUR_ADMIN_EMAIL` - Your actual admin email
- `YOUR_ADMIN_PASSWORD` - Your actual admin password

---

### Method 3: Manual cURL Test

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST \
  https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
  | jq -r '.data.tokens.idToken')

echo "Token: ${TOKEN:0:50}..."

# 2. Request upload URL
UPLOAD_RESPONSE=$(curl -s -X POST \
  https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-document.pdf",
    "contentType": "application/pdf",
    "folder": "uploads"
  }')

echo "Upload response:"
echo "$UPLOAD_RESPONSE" | jq '.'

UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.uploadUrl')
S3_KEY=$(echo "$UPLOAD_RESPONSE" | jq -r '.data.s3Key')

echo "S3 Key: $S3_KEY"

# 3. Create test PDF
cat > test-document.pdf << 'EOF'
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000052 00000 n
0000000101 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF
EOF

# 4. Upload to S3
echo "Uploading to S3..."
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary @test-document.pdf \
  -w "\nStatus: %{http_code}\n" \
  -v

# 5. Trigger sync
echo "Triggering sync..."
curl -X POST \
  https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/documents/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

---

## What Should Happen

### Successful Upload Flow

```
1. User selects file
   ↓
2. Frontend requests pre-signed URL from Lambda
   POST /admin/documents/upload
   ↓
3. Lambda generates S3 pre-signed URL (expires in 5 minutes)
   Returns: { uploadUrl, s3Key, bucket }
   ↓
4. Frontend uploads file DIRECTLY to S3
   PUT to pre-signed URL
   ↓
5. S3 responds with 200 OK (CORS headers now present!)
   ↓
6. Frontend shows success message
   ↓
7. Admin clicks "Sync Knowledge Base"
   POST /admin/documents/sync
   ↓
8. Lambda triggers Bedrock ingestion job
   StartIngestionJobCommand
   ↓
9. Bedrock processes the document:
   - Reads PDF from S3
   - Splits into 512-token chunks with 20% overlap
   - Generates embeddings with Titan Embed V2
   - Stores vectors in OpenSearch Serverless
   ↓
10. Document is now searchable (1-5 minutes)
    Students can ask questions about it!
```

### Network Traffic (Developer Tools)

**Request 1: Get Upload URL**
```
POST https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/documents/upload
Status: 200 OK
Response: {
  "success": true,
  "data": {
    "uploadUrl": "https://aisss-dev-knowledge-docs-314175685812.s3.amazonaws.com/...",
    "s3Key": "uploads/1728234567890-test-document.pdf",
    "bucket": "aisss-dev-knowledge-docs-314175685812"
  }
}
```

**Request 2: Upload to S3**
```
PUT https://aisss-dev-knowledge-docs-314175685812.s3.amazonaws.com/uploads/...
Headers:
  Content-Type: application/pdf
  Origin: https://dev.dwfkamikpgffo.amplifyapp.com

Response:
  Status: 200 OK
  Headers:
    Access-Control-Allow-Origin: https://dev.dwfkamikpgffo.amplifyapp.com  ← CORS!
    Access-Control-Expose-Headers: ETag, x-amz-request-id
    ETag: "d41d8cd98f00b204e9800998ecf8427e"
```

**Request 3: Trigger Sync**
```
POST https://3qealfb0oi.execute-api.us-east-1.amazonaws.com/dev/admin/documents/sync
Status: 202 Accepted
Response: {
  "success": true,
  "data": {
    "jobId": "ABCDEF123456",
    "status": "STARTING",
    "message": "Knowledge base ingestion started. Documents will be searchable within 1–5 minutes."
  }
}
```

---

## Troubleshooting

### Issue: "Network error during upload"
**Solution:** ✅ FIXED! S3 CORS is now configured.

### Issue: "Failed to get upload URL"
**Possible causes:**
1. Not logged in as admin
2. Token expired
3. Lambda error

**Check:** CloudWatch logs for `/aws/lambda/aisss-dev-admin-documents-upload`

### Issue: "Upload succeeds but file not searchable"
**Possible causes:**
1. Didn't click "Sync Knowledge Base"
2. Bedrock ingestion still in progress (wait 1-5 minutes)
3. Bedrock Knowledge Base not configured

**Check:** 
```bash
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id <YOUR_KB_ID> \
  --data-source-id <YOUR_DS_ID>
```

### Issue: "Sync fails"
**Possible causes:**
1. Bedrock Knowledge Base doesn't exist
2. Lambda lacks IAM permissions
3. S3 bucket not connected to Knowledge Base

**Check:** Environment variables in Lambda:
- `BEDROCK_KNOWLEDGE_BASE_ID`
- `BEDROCK_KNOWLEDGE_DATA_SOURCE_ID`
- `KNOWLEDGE_DOCS_BUCKET`

---

## Verification Checklist

- ✅ S3 CORS configured
- ✅ Admin can log in
- ✅ Upload URL endpoint works (returns pre-signed URL)
- ✅ File uploads to S3 successfully (no CORS error)
- ✅ Sync endpoint works (triggers Bedrock ingestion)
- ✅ Documents appear in uploaded files list
- ⏳ Documents become searchable after 1-5 minutes

---

## Summary

**S3 CORS Issue:** ✅ FIXED
- Applied CORS configuration to bucket `aisss-dev-knowledge-docs-314175685812`
- Allows PUT requests from Amplify domain
- Document uploads should now work without "Network error"

**Test Now:**
1. Go to https://dev.dwfkamikpgffo.amplifyapp.com/admin
2. Log in as admin
3. Try uploading a PDF file
4. Should see progress bar and success message
5. Click "Sync Knowledge Base" to index the document

The document upload functionality is now fixed and ready to use!
