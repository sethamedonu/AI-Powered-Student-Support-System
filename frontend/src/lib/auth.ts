import type { RequestEventBase } from '@builder.io/qwik-city';
import { authApi, clearTokens, getStoredUser, saveTokens } from './api';
import type { User } from './types';

// ─── Client-side helpers ─────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

export function getCurrentUser(): User | null {
  return getStoredUser();
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'admin';
}

export async function logout(): Promise<void> {
  clearTokens();
  window.location.href = '/auth/login';
}

export async function refreshSession(): Promise<boolean> {
  try {
    const result = await authApi.refresh();
    saveTokens({
      accessToken: result.accessToken,
      idToken: result.idToken,
      refreshToken: localStorage.getItem('refreshToken') ?? '',
    });
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

// ─── Server-side guards (use inside routeLoader$) ────────────────────────────

/**
 * Read the user object stored in the cookie set at login.
 * Returns null when the cookie is absent or unparseable.
 */
export function getUserFromCookie(event: RequestEventBase): User | null {
  const raw = event.cookie.get('user')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    return null;
  }
}

/**
 * Guard for protected pages.
 * If no valid accessToken cookie is present, redirects to /auth/login
 * preserving the current URL as a `redirect` query param.
 *
 * Usage inside routeLoader$:
 *   export const useAuthGuard = routeLoader$(async (event) => {
 *     return requireAuth(event);
 *   });
 */
export function requireAuth(event: RequestEventBase): User {
  const token = event.cookie.get('accessToken')?.value;
  if (!token) {
    const returnTo = encodeURIComponent(event.url.pathname + event.url.search);
    throw event.redirect(302, `/auth/login?redirect=${returnTo}`);
  }
  const user = getUserFromCookie(event);
  if (!user) {
    // Token present but user cookie is missing/corrupt — clear and re-auth
    event.cookie.delete('accessToken', { path: '/' });
    event.cookie.delete('refreshToken', { path: '/' });
    event.cookie.delete('user', { path: '/' });
    throw event.redirect(302, '/auth/login');
  }
  return user;
}

/**
 * Admin-only guard. Redirects non-admins to /dashboard.
 * Calls requireAuth internally — no need to call both.
 */
export function requireAdmin(event: RequestEventBase): User {
  const user = requireAuth(event);
  if (user.role !== 'admin') {
    throw event.redirect(302, '/dashboard');
  }
  return user;
}

/**
 * Guard for auth pages (login, register, etc.).
 * If the user is already logged in, redirects to /dashboard
 * or to the `redirect` query param if present.
 */
export function redirectIfAuthenticated(event: RequestEventBase): void {
  const token = event.cookie.get('accessToken')?.value;
  if (token) {
    const returnTo = event.url.searchParams.get('redirect');
    throw event.redirect(302, returnTo ?? '/dashboard');
  }
}

// ─── Display helpers ─────────────────────────────────────────────────────────

export function getInitials(user: User): string {
  return `${user.givenName[0] ?? ''}${user.familyName[0] ?? ''}`.toUpperCase();
}

export function getFullName(user: User): string {
  return `${user.givenName} ${user.familyName}`;
}
