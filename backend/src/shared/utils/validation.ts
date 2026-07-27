import { z, ZodSchema } from 'zod';
import { ValidationError } from '../errors/index.js';

export function validateBody<T>(schema: ZodSchema<T>, body: string | null): T {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError('Request validation failed', result.error.flatten().fieldErrors);
  }

  return result.data;
}

export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  params: Record<string, string | undefined> | null,
): T {
  const result = schema.safeParse(params ?? {});
  if (!result.success) {
    throw new ValidationError('Query parameter validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
}

export function validatePathParams<T>(
  schema: ZodSchema<T>,
  params: Record<string, string | undefined> | null,
): T {
  const result = schema.safeParse(params ?? {});
  if (!result.success) {
    throw new ValidationError('Path parameter validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
}

export { z };
