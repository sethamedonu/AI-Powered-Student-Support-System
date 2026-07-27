import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ApiResponse } from '../types/index.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env['CORS_ALLOWED_ORIGINS'] ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

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
    headers: CORS_HEADERS,
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
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

export function optionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: '',
  };
}
