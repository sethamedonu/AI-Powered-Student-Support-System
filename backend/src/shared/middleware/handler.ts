import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { isAppError } from '../errors/index.js';
import { errorResponse, optionsResponse } from '../utils/response.js';
import { createLogger } from '../utils/logger.js';
import { emitColdStart } from '../utils/metrics.js';
import type { AuthContext } from '../types/index.js';
import { extractAuthContext } from './auth.js';
import { env } from '../types/env.js';

let isColdStart = true;

const logger = createLogger('handler-factory');

export interface HandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

export type HandlerFn<TResult = unknown> = (params: {
  event: APIGatewayProxyEvent;
  context: Context;
  auth: AuthContext | null;
  requestId: string;
  log: ReturnType<typeof createLogger>;
}) => Promise<TResult>;

export function createHandler(
  fn: HandlerFn<APIGatewayProxyResult>,
  options: HandlerOptions = {},
) {
  return async (
    event: APIGatewayProxyEvent,
    context: Context,
  ): Promise<APIGatewayProxyResult> => {
    const requestId = context.awsRequestId;
    const log = logger.withContext({
      requestId,
      path: event.path,
      method: event.httpMethod,
      function: context.functionName,
    });

    if (event.httpMethod === 'OPTIONS') {
      return optionsResponse();
    }

    if (isColdStart) {
      emitColdStart(context.functionName, env.NODE_ENV);
      log.info('Cold start detected', { functionName: context.functionName });
      isColdStart = false;
    }

    log.info('Request received');

    let auth: AuthContext | null = null;

    try {
      if (options.requireAuth !== false) {
        auth = await extractAuthContext(event);

        if (options.requireAdmin && auth.role !== 'admin') {
          return errorResponse('FORBIDDEN', 'Admin access required', 403, requestId);
        }
      }

      const result = await fn({ event, context, auth, requestId, log });

      log.info('Request completed', { statusCode: result.statusCode });
      return result;
    } catch (error) {
      if (isAppError(error)) {
        log.warn('Application error', { code: error.code, message: error.message, statusCode: error.statusCode });
        return errorResponse(error.code, error.message, error.statusCode, requestId, error.details);
      }

      log.error('Unhandled error', error);
      return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500, requestId);
    }
  };
}
