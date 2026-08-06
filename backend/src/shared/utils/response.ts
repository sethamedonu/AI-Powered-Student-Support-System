import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ApiResponse } from '../types/index.js';

/**
 * Allowed origins stored as a comma-separated env var.
 * Example:
 *   CORS_ALLOWED_ORIGINS=https://dev.dwfkamikpgffo.amplifyapp.com,http://localhost:3000
 * 
 * TEMPORARY FIX: Hardcoded to Amplify URL until deploy pipeline is fixed
 */
const RAW_ORIGINS = process.env['CORS_ALLOWED_ORIGINS'] ?? 'https://dev.dwfkamikpgffo.amplifyapp.com,http://localhost:3000';

/**
 * Per-invocation request origin. Set by the handler middleware at the start
 * of each Lambda invocation so all response builders reflect the correct
 * Access-Control-Allow-Origin without per-handler changes.
 *
 * Lambda execution contexts are single-threaded so this is safe.
 */
let _currentOrigin: string | undefined;

export function setRequestOrigin(origin: string | undefined): void {
  _currentOrigin = origin;
}

function resolveOrigin(): string {
  if (RAW_ORIGINS === '*') return '*';

  const allowedList = RAW_ORIGINS.split(',').map((o) => o.trim());

  if (_currentOrigin && allowedList.includes(_currentOrigin)) {
    return _currentOrigin;
  }

  // Fallback to first allowed origin; browser will block if origin doesn't match
  return allowedList[0] ?? '*';
}

function buildHeaders(): Record<string, string> {
  const origin = resolveOrigin();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json',
  };
  // Credentials + Vary only when using a specific origin (not wildcard)
  if (origin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }
  return headers;
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
