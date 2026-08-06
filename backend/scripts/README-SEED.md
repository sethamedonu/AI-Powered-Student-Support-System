# Knowledge Base Seeding Script

This script populates the UCC AI-Powered Student Support System knowledge base with sample data.

## What It Does

**Hybrid Seeding Approach:**
1. **Creates PDF documents** with UCC student information (admissions, tuition, exams, etc.)
2. **Uploads to S3** (`aisss-dev-knowledge-docs-314175685812` bucket)
3. **Saves structured data** to DynamoDB (`aisss-dev-knowledge-base` table)
4. **Triggers Bedrock ingestion** to create vector embeddings

## Prerequisites

### Environment Variables

Ensure these are set in your `.env` file or environment:

```bash
AWS_REGION=us-east-1
KNOWLEDGE_DOCS_BUCKET=aisss-dev-knowledge-docs-314175685812
DYNAMODB_TABLE_KNOWLEDGE=aisss-dev-knowledge-base
BEDROCK_KNOWLEDGE_BASE_ID=86HYJUEMJL
BEDROCK_KNOWLEDGE_DATA_SOURCE_ID=OTSDN45AJ7
```

### AWS Credentials

Configure AWS credentials with permissions for:
- S3: `PutObject` on knowledge docs bucket
- DynamoDB: `PutItem` on knowledge table
- Bedrock: `StartIngestionJob` on knowledge base

```bash
# Option 1: AWS CLI profile
export AWS_PROFILE=your-profile

# Option 2: Environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
```

## Usage

### Full Seeding (Recommended)

Seeds both S3 documents and DynamoDB entries:

```bash
cd backend
npm run seed:kb
```

### Dry Run

Preview what will be seeded without making changes:

```bash
npm run seed:kb:dry-run
```

### Partial Seeding

Skip S3 uploads (DynamoDB only):
```bash
node --loader ts-node/esm scripts/seed-knowledge-base.ts --skip-s3
```

Skip DynamoDB (S3 uploads only):
```bash
node --loader ts-node/esm scripts/seed-knowledge-base.ts --skip-dynamodb
```

## Sample Content Included

The script seeds **9 comprehensive documents** covering:

| Category | Document | Content |
|----------|----------|---------|
| `admissions` | General Admission Requirements | WASSCE requirements, aggregates, mature students |
| `admissions` | Application Process and Deadlines | Step-by-step application guide, voucher purchase |
| `registration` | Course Registration Guide | Online registration, credit hours, add/drop |
| `tuition` | Tuition Fees and Payment Options | Fee structure, payment methods, installments |
| `examinations` | Examination Rules and Procedures | Exam rules, docket requirements, conduct |
| `calendar` | Academic Calendar 2024/2025 | Semester dates, holidays, deadlines |
| `graduation` | Graduation Requirements | CGPA requirements, degree classification |
| `scholarships` | Scholarships and Financial Aid | Merit/need-based scholarships, GETFUND |
| `campus-services` | Campus Facilities and Services | Library, health, accommodation, sports |
| `general` | General Information | Contact details, emergency numbers, location |

## Output

### Success Output
```
🌱 UCC Knowledge Base Seeding Script

═══════════════════════════════════════════════════════════

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
  ...

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

## Verification

### Check S3 Bucket
```bash
aws s3 ls s3://aisss-dev-knowledge-docs-314175685812/ --recursive
```

### Check DynamoDB Table
```bash
aws dynamodb scan \
  --table-name aisss-dev-knowledge-base \
  --select COUNT
```

### Check Bedrock Ingestion Status
```bash
aws bedrock-agent get-ingestion-job \
  --knowledge-base-id 86HYJUEMJL \
  --data-source-id OTSDN45AJ7 \
  --ingestion-job-id <job-id-from-output>
```

## Testing the Knowledge Base

Once ingestion completes (2-5 minutes), test via the chat interface:

**Test Questions:**
- "What are the admission requirements?"
- "How do I register for courses?"
- "When is the tuition payment deadline?"
- "What scholarships are available?"
- "Where is the library located?"

## Customization

To add your own content:

1. Edit `KNOWLEDGE_ENTRIES` array in `seed-knowledge-base.ts`
2. Add new entries with:
   - `category`: One of the predefined categories
   - `title`: Document title
   - `content`: Full text content (formatted with line breaks)
   - `keywords`: Array of search keywords

Example:
```typescript
{
  category: 'admissions',
  title: 'International Student Guide',
  content: `Information for international applicants...`,
  keywords: ['international', 'visa', 'foreign']
}
```

## Troubleshooting

### Error: "KNOWLEDGE_DOCS_BUCKET environment variable is required"
- Ensure `.env` file exists with correct values
- Load environment: `source .env` (Linux/Mac) or use dotenv

### Error: "AccessDenied" on S3
- Check AWS credentials have S3 write permissions
- Verify bucket name matches environment variable

### Error: "ResourceNotFoundException" for Bedrock
- Confirm Bedrock Knowledge Base ID is correct
- Ensure Knowledge Base is created and active

### PDFs not appearing in search results
- Wait 2-5 minutes for Bedrock ingestion to complete
- Check ingestion job status in AWS console
- Verify S3 bucket is configured as data source

## Production Considerations

Before running in production:

1. **Backup existing data** if any
2. **Review content** for accuracy and completeness
3. **Test in dev environment** first
4. **Consider idempotency**: Script creates new entries each run
5. **Monitor costs**: S3 storage and Bedrock ingestion have costs

## Additional Resources

- [Bedrock Knowledge Base Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [S3 Vectors Documentation](https://docs.aws.amazon.com/s3/latest/userguide/s3-vectors.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
