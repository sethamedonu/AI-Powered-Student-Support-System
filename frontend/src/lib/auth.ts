import { authApi, clearTokens, getStoredUser, saveTokens } from './api';
import type { User } from './types';

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

/** Redirect to login if not authenticated. Call in routeLoader$. */
export function requireAuth(url: URL): Response | null {
  // Server-side: check cookie or header — for now handled client-side
  return null;
}

/** Redirect to dashboard if already authenticated. */
export function redirectIfAuthenticated(url: URL): Response | null {
  return null;
}

export function getInitials(user: User): string {
  return `${user.givenName[0] ?? ''}${user.familyName[0] ?? ''}`.toUpperCase();
}

export function getFullName(user: User): string {
  return `${user.givenName} ${user.familyName}`;
}
