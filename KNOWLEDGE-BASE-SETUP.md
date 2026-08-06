# Knowledge Base Setup Guide

## Overview

The AI-Powered Student Support System uses a **hybrid knowledge base architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    DUAL STORAGE SYSTEM                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────┐     ┌──────────────────────────┐
│   DynamoDB Table         │     │   Amazon Bedrock KB      │
│   (Structured Metadata)  │     │   (Semantic Search)      │
├──────────────────────────┤     ├──────────────────────────┤
│ • Q&A entries            │     │ • PDF/DOCX documents     │
│ • Keyword fallback       │     │ • Vector embeddings      │
│ • Fast category queries  │     │ • AI-powered retrieval   │
│ • Metadata management    │     │ • Context for responses  │
└──────────────────────────┘     └──────────────────────────┘
            ↓                                 ↓
     Keyword Search                  Semantic Search
     (When Bedrock fails)            (Primary method)
```

## Quick Start

### 1. Set Environment Variables

Ensure these are configured:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=your-profile  # or use AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY

# S3 Bucket for Documents
KNOWLEDGE_DOCS_BUCKET=aisss-dev-knowledge-docs-314175685812

# DynamoDB Table
DYNAMODB_TABLE_KNOWLEDGE=aisss-dev-knowledge-base

# Bedrock Knowledge Base
BEDROCK_KNOWLEDGE_BASE_ID=86HYJUEMJL
BEDROCK_KNOWLEDGE_DATA_SOURCE_ID=OTSDN45AJ7
```

### 2. Run the Seeding Script

```bash
cd backend
npm install  # Installs pdf-lib and other dependencies
npm run seed:kb
```

### 3. Wait for Indexing

Bedrock needs **2-5 minutes** to process documents and create embeddings.

### 4. Test It

Ask questions in the chat interface:
- "What are the admission requirements?"
- "How much is tuition?"
- "When do exams start?"

## Architecture Deep Dive

### Data Flow

```
Admin Action → Script Execution
     ↓
1. Create PDF Documents (pdf-lib)
     ↓
2. Upload to S3 Bucket
   s3://aisss-dev-knowledge-docs-314175685812/
   ├── admissions/
   │   ├── general-admission-requirements.pdf
   │   └── application-process-and-deadlines.pdf
   ├── tuition/
   │   └── tuition-fees-and-payment-options.pdf
   └── ...
     ↓
3. Save Metadata to DynamoDB
   Table: aisss-dev-knowledge-base
   Items: { knowledgeId, category, title, content, keywords }
     ↓
4. Trigger Bedrock Ingestion
   StartIngestionJobCommand
     ↓
5. Bedrock Processing
   • Chunks documents (512 tokens, 20% overlap)
   • Creates embeddings (Titan Embed V2, 1024-dim)
   • Stores in OpenSearch Serverless
     ↓
6. Ready for Search!
   Student queries → Retrieve API → Relevant chunks → AI Response
```

### Search Behavior

When a student asks a question:

1. **Primary: Bedrock Semantic Search**
   - Uses `RetrieveCommand` with vector similarity
   - Returns top 5 most relevant document chunks
   - Provides context to AI for natural language response

2. **Fallback: DynamoDB Keyword Search**
   - Triggered if Bedrock fails or is unavailable
   - Scans DynamoDB for keyword matches
   - Returns structured Q&A entries

## File Structure

```
backend/
├── scripts/
│   ├── seed-knowledge-base.ts    # Main seeding script
│   └── README-SEED.md            # Detailed documentation
├── src/
│   ├── functions/
│   │   └── admin/
│   │       ├── upsertKnowledge.ts   # API endpoint for adding knowledge
│   │       ├── uploadDocument.ts    # Generate presigned S3 URLs
│   │       └── syncKnowledge.ts     # Manual ingestion trigger
│   └── core/
│       └── infrastructure/
│           └── repositories/
│               └── knowledge.repository.ts  # DynamoDB + Bedrock queries
└── package.json
```

## Maintenance

### Adding New Content

**Option 1: Via Seed Script** (Batch)
1. Edit `backend/scripts/seed-knowledge-base.ts`
2. Add entries to `KNOWLEDGE_ENTRIES` array
3. Run `npm run seed:kb`

**Option 2: Via Admin API** (Single Entry)
```bash
curl -X POST https://api.yourdomain.com/admin/knowledge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "admissions",
    "title": "Transfer Student Guide",
    "content": "Information for transfer students...",
    "keywords": ["transfer", "credit", "evaluation"]
  }'
```

**Option 3: Upload Documents Directly**
```bash
# Get presigned URL
curl -X POST https://api.yourdomain.com/admin/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"fileName": "handbook.pdf", "contentType": "application/pdf"}'

# Upload file
curl -X PUT "$PRESIGNED_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary @handbook.pdf

# Trigger ingestion
curl -X POST https://api.yourdomain.com/admin/documents/sync \
  -H "Authorization: Bearer $TOKEN"
```

### Updating Existing Content

1. DynamoDB entries: Use `upsertKnowledge` with same `knowledgeId`
2. S3 documents: Upload new version to S3, trigger sync
3. Automatic: Bedrock re-indexes on sync

### Monitoring

**Check S3 Contents:**
```bash
aws s3 ls s3://aisss-dev-knowledge-docs-314175685812/ --recursive
```

**Check DynamoDB Count:**
```bash
aws dynamodb scan \
  --table-name aisss-dev-knowledge-base \
  --select COUNT
```

**Check Bedrock Ingestion Jobs:**
```bash
aws bedrock-agent list-ingestion-jobs \
  --knowledge-base-id 86HYJUEMJL \
  --data-source-id OTSDN45AJ7
```

**Test Search:**
```bash
aws bedrock-agent-runtime retrieve \
  --knowledge-base-id 86HYJUEMJL \
  --retrieval-query text="admission requirements" \
  --region us-east-1
```

## Cost Considerations

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| S3 Storage | ~10 PDF files (5MB) | $0.02/month |
| DynamoDB | On-demand, 10 items | $0.25/month |
| Bedrock Embeddings | 10 documents @ ingestion | $0.10 one-time |
| Bedrock Retrieve API | 1000 queries/month | $0.30/month |
| OpenSearch Serverless | Vector storage | $5-10/month |

**Total:** ~$5-10/month for small-scale usage

## Troubleshooting

### Symptom: "Failed to fetch" errors in chat

**Possible Causes:**
1. Knowledge base is empty (check DynamoDB and S3)
2. Bedrock ingestion not complete (wait 5 minutes)
3. Bedrock KB not configured (check env vars)

**Solution:**
Run seeding script and wait for ingestion to complete.

### Symptom: AI responses lack context

**Cause:** Bedrock not finding relevant documents

**Solutions:**
1. Improve document content with more keywords
2. Add more documents covering the topic
3. Use more specific question phrasing
4. Check Bedrock retrieval logs

### Symptom: Seeding script fails with AccessDenied

**Cause:** AWS credentials lack permissions

**Solution:**
Ensure IAM role/user has these policies:
- `s3:PutObject` on knowledge docs bucket
- `dynamodb:PutItem` on knowledge table
- `bedrock:StartIngestionJob` on KB

## Next Steps

1. ✅ Run seed script to populate knowledge base
2. ⏳ Wait 5 minutes for Bedrock indexing
3. 🧪 Test with sample questions
4. 📝 Customize content with university-specific information
5. 📊 Monitor usage and refine content based on queries
6. 🔄 Set up regular content updates

## Additional Resources

- [Bedrock Knowledge Bases Developer Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html)
- [S3 Vectors Documentation](https://docs.aws.amazon.com/s3/latest/userguide/s3-vectors.html)
- [Titan Embeddings V2 Model Card](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html)
- Backend Seed Script: `backend/scripts/README-SEED.md`
