import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  saveTokens,
  clearTokens,
  saveUser,
  getStoredUser,
  ApiError,
} from '../../src/lib/api';
import type { User } from '../../src/lib/types';

const mockUser: User = {
  userId: 'user-123',
  email: 'student@test.com',
  givenName: 'Jane',
  familyName: 'Doe',
  role: 'student',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('token helpers', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('saveTokens stores all three tokens', () => {
    saveTokens({ accessToken: 'acc', idToken: 'id', refreshToken: 'ref' });
    expect(localStorage.getItem('accessToken')).toBe('acc');
    expect(localStorage.getItem('idToken')).toBe('id');
    expect(localStorage.getItem('refreshToken')).toBe('ref');
  });

  it('clearTokens removes all auth data', () => {
    saveTokens({ accessToken: 'acc', idToken: 'id', refreshToken: 'ref' });
    saveUser(mockUser);
    clearTokens();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('idToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('user storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('saveUser and getStoredUser round-trip correctly', () => {
    saveUser(mockUser);
    expect(getStoredUser()).toEqual(mockUser);
  });

  it('getStoredUser returns null when nothing stored', () => {
    expect(getStoredUser()).toBeNull();
  });

  it('getStoredUser returns null for corrupted data', () => {
    localStorage.setItem('user', 'not-valid-json{{{');
    expect(getStoredUser()).toBeNull();
  });
});

describe('ApiError', () => {
  it('has correct name, code, message, and status', () => {
    const err = new ApiError('NOT_FOUND', 'Resource not found', 404);
    expect(err.name).toBe('ApiError');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.status).toBe(404);
    expect(err instanceof Error).toBe(true);
  });

  it('is distinguishable from plain Error', () => {
    const err = new ApiError('UNAUTHORIZED', 'Unauthorized', 401);
    expect(err instanceof ApiError).toBe(true);
    expect(new Error('test') instanceof ApiError).toBe(false);
  });
});
