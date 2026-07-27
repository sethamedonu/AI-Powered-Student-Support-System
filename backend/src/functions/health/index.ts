import { createHandler } from '../../shared/middleware/handler.js';
import { successResponse } from '../../shared/utils/response.js';
import { env } from '../../shared/types/env.js';

export const handler = createHandler(
  async ({ requestId }) => {
    return successResponse(
      {
        status: 'healthy',
        environment: env.NODE_ENV,
        region: env.AWS_REGION,
        timestamp: new Date().toISOString(),
      },
      200,
      requestId,
    );
  },
  { requireAuth: false },
);
