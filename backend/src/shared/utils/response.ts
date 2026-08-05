import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ApiResponse } from '../types/index.js';

/**
 * Allowed origins stored as a comma-separated env var.
 * Example:
 *   CORS_ALLOWED_ORIGINS=https://dev.dwfkamikpgffo.amplifyapp.com,http://localhost:3000
 */
const RAW_ORIGINS = process.env['CORS_ALLOWED_ORIGINS'] ?? '*';

/**
 * Per-invocation request origin.
 * Set by the handler middleware at the start of each Lambda invocation so
 * that successResponse/errorResponse can reflect the correct origin without
 * every call-site needing to pass the event.
 *
 * Lambda execution contexts are single-threaded so this is safe.
 */
let _currentOrigin: string | undefined;

export function setRequestOrigin(origin: string | undefined): void {
  _currentOrigin = origin;
}

/**
 * Resolve the Access-Control-Allow-Origin header value.
 * - '*' env var → return '*' (wildcard, no credentials)
 * - Otherwise reflect the request origin if it's in the allowed list,
 *   or fall back to the first allowed origin.
 */
function resolveOrigin(): string {
  if (RAW_ORIGINS === '*') return '*';

  const allowedList = RAW_ORIGINS.split(',').map((o) => o.trim());

  if (_currentOrigin && allowedList.includes(_currentOrigin)) {
    return _currentOrigin;
  }

  return allowedList[0] ?? '*';
}

function buildHeaders() {
  const origin = resolveOrigin();
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    // Only add Vary + credentials header when not using wildcard
    ...(origin !== '*' && {
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    }),
    'Content-Type': 'application/json',
  };
}

export function successResponse<T>(
  data: T,
  statusCode = 200,
  requestId?: string,
): APIGatewayProxyResult {
  const body: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  return {
    statusCode,
    headers: buildHeaders(),
    body: JSON.stringify(body),
  };
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  requestId?: string,
  details?: unknown,
): APIGatewayProxyResult {
  const body: ApiResponse = {
    success: false,
    error: { code, message, details },
    meta: {
      requestId: requestId ?? 'unknown',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  };

  return {
    statusCode,
    headers: buildHeaders(),
    body: JSON.stringify(body),
  };
}

export function optionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: buildHeaders(),
    body: '',
  };
}
