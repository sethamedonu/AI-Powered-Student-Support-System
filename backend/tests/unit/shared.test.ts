import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateId, generateCacheKey, nowIso, ttlFromNow, ttlDays, isExpired } from '../../src/shared/utils/helpers.js';
import { successResponse, errorResponse, optionsResponse } from '../../src/shared/utils/response.js';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  isAppError,
} from '../../src/shared/errors/index.js';

describe('helpers', () => {
  it('generateId returns a valid UUID', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generateId returns unique values', () => {
    expect(generateId()).not.toBe(generateId());
  });

  it('generateCacheKey normalizes whitespace and casing', () => {
    const a = generateCacheKey('What  is  the  tuition fee?');
    const b = generateCacheKey('what is the tuition fee?');
    expect(a).toBe(b);
  });

  it('nowIso returns a valid ISO string', () => {
    expect(() => new Date(nowIso())).not.toThrow();
  });

  it('ttlFromNow returns a future unix timestamp', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(ttlFromNow(60)).toBeGreaterThan(now);
  });

  it('ttlDays returns correct TTL', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(ttlDays(1)).toBeCloseTo(now + 86400, -2);
  });

  it('isExpired returns true for past TTL', () => {
    expect(isExpired(Math.floor(Date.now() / 1000) - 1)).toBe(true);
  });

  it('isExpired returns false for future TTL', () => {
    expect(isExpired(Math.floor(Date.now() / 1000) + 3600)).toBe(false);
  });
});

describe('response builder', () => {
  it('successResponse returns correct shape', () => {
    const res = successResponse({ name: 'test' }, 200, 'req-123');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as { success: boolean; data: unknown };
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ name: 'test' });
  });

  it('errorResponse returns correct shape', () => {
    const res = errorResponse('NOT_FOUND', 'Resource not found', 404, 'req-123');
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body) as { success: boolean; error: { code: string } };
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('optionsResponse returns 204 with CORS headers', () => {
    const res = optionsResponse();
    expect(res.statusCode).toBe(204);
    expect(res.headers?.['Access-Control-Allow-Methods']).toBeDefined();
  });
});

describe('error classes', () => {
  it('ValidationError has correct statusCode and code', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid input');
  });

  it('UnauthorizedError defaults to 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('NotFoundError formats resource name', () => {
    const err = new NotFoundError('User');
    expect(err.message).toBe('User not found');
    expect(err.statusCode).toBe(404);
  });

  it('ForbiddenError defaults to 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it('isAppError returns true for AppError instances', () => {
    expect(isAppError(new ValidationError('test'))).toBe(true);
    expect(isAppError(new Error('test'))).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });
});
