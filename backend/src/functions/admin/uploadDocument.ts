/**
 * admin/uploadDocument.ts
 *
 * Generates a pre-signed S3 PUT URL so the admin frontend can upload
 * PDFs directly to S3 without routing them through Lambda.
 *
 * Flow:
 *   1. Admin calls POST /admin/documents/upload  { fileName, contentType }
 *   2. This Lambda returns a pre-signed URL (valid 5 minutes)
 *   3. Frontend PUTs the file directly to S3 using that URL
 *   4. After upload completes, admin calls POST /admin/documents/sync
 *      (or upsertKnowledge) to trigger Bedrock KB ingestion
 */

import { z } from 'zod';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { validateBody } from '../../shared/utils/validation.js';
import { createLogger } from '../../shared/utils/logger.js';
import { env } from '../../shared/types/env.js';

const logger = createLogger('upload-document');

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
];

const UploadSchema = z.object({
  // The file name to store in S3 (e.g. "admission-policy-2026.pdf")
  fileName: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9\-_. ]+$/, 'File name may only contain letters, numbers, hyphens, underscores, spaces, and dots'),

  // MIME type — must be an allowed document type
  contentType: z.enum(
    ALLOWED_CONTENT_TYPES as [string, ...string[]],
    { errorMap: () => ({ message: `Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}` }) },
  ),

  // Optional folder prefix inside the bucket (e.g. "admissions", "tuition")
  folder: z.string().max(100).optional(),
});

export const handler = createHandler(
  async ({ event, requestId }): Promise<APIGatewayProxyResult> => {
    if (!env.KNOWLEDGE_DOCS_BUCKET) {
      throw new Error('KNOWLEDGE_DOCS_BUCKET is not configured');
    }

    const input = validateBody(UploadSchema, event.body);

    // Build the S3 key — folder prefix + sanitised file name
    const sanitizedName = input.fileName.replace(/\s+/g, '-');
    const folder = input.folder ?? 'uploads';
    const s3Key = `${folder}/${Date.now()}-${sanitizedName}`;

    const s3 = new S3Client({ region: env.BEDROCK_REGION ?? env.AWS_REGION });

    const command = new PutObjectCommand({
      Bucket: env.KNOWLEDGE_DOCS_BUCKET,
      Key: s3Key,
      ContentType: input.contentType,
      // Metadata stored with the object for traceability
      Metadata: {
        'original-name': input.fileName,
        'uploaded-at': new Date().toISOString(),
      },
    });

    // Pre-signed URL expires in 5 minutes
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    logger.info('Generated pre-signed upload URL', {
      bucket: env.KNOWLEDGE_DOCS_BUCKET,
      key: s3Key,
      contentType: input.contentType,
    });

    return successResponse(
      {
        uploadUrl,
        s3Key,
        bucket: env.KNOWLEDGE_DOCS_BUCKET,
        // The frontend uses this key to show upload progress and then
        // call the sync endpoint to trigger KB ingestion
        message: 'Upload the file using a PUT request to uploadUrl. The file will be indexed in the knowledge base within 1–2 minutes after upload.',
      },
      200,
      requestId,
    );
  },
  { requireAuth: true, requireAdmin: true },
);
