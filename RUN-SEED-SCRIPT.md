# Quick Guide: Run Knowledge Base Seeding Script

## Prerequisites

Before running the script, you need:

### 1. AWS Credentials

Configure AWS credentials that have access to your dev environment:

```powershell
# Option 1: Use AWS CLI profile
$env:AWS_PROFILE = "your-aws-profile-name"

# Option 2: Set credentials directly
$env:AWS_ACCESS_KEY_ID = "your-access-key"
$env:AWS_SECRET_ACCESS_KEY = "your-secret-key"
$env:AWS_REGION = "us-east-1"
```

### 2. Environment Variables

Create or update `backend/.env` file with:

```bash
# AWS Configuration
AWS_REGION=us-east-1

# S3 Bucket for Knowledge Documents
KNOWLEDGE_DOCS_BUCKET=aisss-dev-knowledge-docs-314175685812

# DynamoDB Table
DYNAMODB_TABLE_KNOWLEDGE=aisss-dev-knowledge-base

# Bedrock Knowledge Base Configuration
BEDROCK_KNOWLEDGE_BASE_ID=86HYJUEMJL
BEDROCK_KNOWLEDGE_DATA_SOURCE_ID=OTSDN45AJ7
BEDROCK_REGION=us-east-1
```

## Running the Script

### Step 1: Install Dependencies

```powershell
cd backend
npm install
```

This installs `pdf-lib` and all other required packages.

### Step 2: Test with Dry Run (Recommended First)

Preview what will be created without making changes:

```powershell
npm run seed:kb:dry-run
```

Expected output:
```
🌱 UCC Knowledge Base Seeding Script

═══════════════════════════════════════════════════════════

Configuration:
  AWS Region: us-east-1
  S3 Bucket: aisss-dev-knowledge-docs-314175685812
  DynamoDB Table: aisss-dev-knowledge-base
  Bedrock KB: 86HYJUEMJL
  Mode: DRY RUN
  ...

[1/9] Processing: General Admission Requirements
  Creating PDF...
  [DRY RUN] Would upload to S3: s3://aisss-dev-knowledge-docs-314175685812/admissions/general-admission-requirements.pdf
  [DRY RUN] Would save to DynamoDB: General Admission Requirements
...
```

### Step 3: Run Full Seeding

Execute the actual seeding:

```powershell
npm run seed:kb
```

This will:
1. ✅ Create 9 PDF documents
2. ✅ Upload them to S3
3. ✅ Save structured data to DynamoDB
4. ✅ Trigger Bedrock ingestion job

Expected output:
```
🌱 UCC Knowledge Base Seeding Script

Configuration:
  AWS Region: us-east-1
  S3 Bucket: aisss-dev-knowledge-docs-314175685812
  DynamoDB Table: aisss-dev-knowledge-base
  Bedrock KB: 86HYJUEMJL
  Mode: LIVE

[1/9] Processing: General Admission Requirements
  Creating PDF...
  ✓ Uploaded to S3: admissions/general-admission-requirements.pdf
  ✓ Saved to DynamoDB: General Admission Requirements

[2/9] Processing: Application Process and Deadlines
  Creating PDF...
  ✓ Uploaded to S3: admissions/application-process-and-deadlines.pdf
  ✓ Saved to DynamoDB: Application Process and Deadlines

... (continues for all 9 documents)

═══════════════════════════════════════════════════════════

🔄 Triggering Bedrock Knowledge Base ingestion...

✓ Bedrock ingestion job started: abc-123-def-456
  Status: STARTING
  Documents will be searchable in 2-5 minutes

═══════════════════════════════════════════════════════════

📊 Seeding Summary:

  Documents uploaded to S3: 9
  Entries saved to DynamoDB: 9
  Errors: 0

✅ Knowledge base seeded successfully!

⏳ Wait 2-5 minutes for Bedrock to complete indexing.
   Then test queries via the chat interface.
```

### Step 4: Wait for Bedrock Indexing

**Important:** Bedrock needs 2-5 minutes to:
- Process PDF documents
- Create embeddings (1024-dimensional vectors)
- Index them in OpenSearch Serverless

☕ Grab a coffee and wait ~5 minutes before testing.

### Step 5: Verify the Seeding

#### Check S3 Bucket
```powershell
aws s3 ls s3://aisss-dev-knowledge-docs-314175685812/ --recursive
```

Expected:
```
2024-08-06  admissions/general-admission-requirements.pdf
2024-08-06  admissions/application-process-and-deadlines.pdf
2024-08-06  registration/course-registration-guide.pdf
2024-08-06  tuition/tuition-fees-and-payment-options.pdf
2024-08-06  examinations/examination-rules-and-procedures.pdf
2024-08-06  calendar/academic-calendar-2024-2025.pdf
2024-08-06  graduation/graduation-requirements-and-process.pdf
2024-08-06  scholarships/scholarships-and-financial-aid.pdf
2024-08-06  campus-services/campus-facilities-and-services.pdf
```

#### Check DynamoDB Table
```powershell
aws dynamodb scan --table-name aisss-dev-knowledge-base --select COUNT
```

Expected:
```json
{
  "Count": 9,
  "ScannedCount": 9
}
```

#### Check Bedrock Ingestion Status
```powershell
aws bedrock-agent list-ingestion-jobs `
  --knowledge-base-id 86HYJUEMJL `
  --data-source-id OTSDN45AJ7 `
  --max-results 1
```

Look for `"status": "COMPLETE"`

### Step 6: Test in the Chat Interface

Once ingestion is complete, test these questions:

1. **"What are the admission requirements?"**
   - Should return info about WASSCE, aggregates, etc.

2. **"How much is tuition for science students?"**
   - Should return GHS 4,200 per semester

3. **"When do I register for courses?"**
   - Should explain online registration process

4. **"Where is the library?"**
   - Should mention Sam Jonah Library

5. **"What scholarships are available?"**
   - Should list Chancellor's, Dean's List, GETFUND, etc.

## Troubleshooting

### Error: "KNOWLEDGE_DOCS_BUCKET environment variable is required"

**Solution:** Ensure `.env` file exists in `backend/` folder with correct values.

```powershell
# Check if .env exists
Test-Path backend/.env

# If not, create it
Copy-Item backend/.env.example backend/.env
# Then edit with correct values
```

### Error: "AccessDenied" when uploading to S3

**Solution:** Check AWS credentials have required permissions:

```powershell
# Test S3 access
aws s3 ls s3://aisss-dev-knowledge-docs-314175685812/

# If denied, check your AWS credentials
aws sts get-caller-identity
```

Required IAM permissions:
- `s3:PutObject` on `aisss-dev-knowledge-docs-314175685812`
- `dynamodb:PutItem` on `aisss-dev-knowledge-base`
- `bedrock:StartIngestionJob` on knowledge base

### Error: "Cannot find module 'pdf-lib'"

**Solution:** Install dependencies:

```powershell
cd backend
npm install
```

### Ingestion job fails or stays in "STARTING" status

**Possible causes:**
1. Bedrock KB not configured correctly
2. S3 bucket not set as data source
3. IAM role missing permissions

**Solution:** Check Bedrock KB configuration in AWS Console:
- Go to Amazon Bedrock > Knowledge bases
- Select your KB (86HYJUEMJL)
- Verify data source points to correct S3 bucket
- Check IAM role has necessary permissions

## Advanced Options

### Seed Only S3 (Skip DynamoDB)
```powershell
node --loader ts-node/esm scripts/seed-knowledge-base.ts --skip-dynamodb
```

### Seed Only DynamoDB (Skip S3)
```powershell
node --loader ts-node/esm scripts/seed-knowledge-base.ts --skip-s3
```

### Both Skips (Just Test Script)
```powershell
node --loader ts-node/esm scripts/seed-knowledge-base.ts --skip-s3 --skip-dynamodb
```

## Next Steps

1. ✅ Run seeding script
2. ⏳ Wait 5 minutes for indexing
3. 🧪 Test with sample questions
4. 📝 Customize content for your university
5. 🔄 Re-run script when you update content

## Support

- Full documentation: `backend/scripts/README-SEED.md`
- Architecture guide: `KNOWLEDGE-BASE-SETUP.md`
- For issues, check: `ISSUES-AND-FIXES.md`
