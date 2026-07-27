import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function generateCacheKey(input: string): string {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
  return Buffer.from(normalized).toString('base64url').slice(0, 64);
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function ttlFromNow(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}

export function ttlDays(days: number): number {
  return ttlFromNow(days * 24 * 60 * 60);
}

export function ttlHours(hours: number): number {
  return ttlFromNow(hours * 60 * 60);
}

export function isExpired(ttl: number): boolean {
  return Math.floor(Date.now() / 1000) > ttl;
}
