/**
 * auth.client.ts — client-side auth helpers only.
 *
 * Safe to import from Client Components ("use client").
 * Does NOT import next/headers or any server-only APIs.
 */
import { clearTokens, saveTokens, authApi } from "./api";
import type { User } from "./types";

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === "admin";
}

export function logout(): void {
  clearTokens();
  const cookieNames = ["accessToken", "refreshToken", "user"];
  cookieNames.forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  });
  window.location.href = "/auth/login";
}

export async function refreshSession(): Promise<boolean> {
  try {
    const result = await authApi.refresh();
    saveTokens({
      accessToken: result.accessToken,
      idToken: result.idToken,
      refreshToken: localStorage.getItem("refreshToken") ?? "",
    });
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export function getInitials(user: User): string {
  return `${user.givenName[0] ?? ""}${user.familyName[0] ?? ""}`.toUpperCase();
}

export function getFullName(user: User): string {
  return `${user.givenName} ${user.familyName}`;
}

/**
 * Read the user from the cookie on the client (document.cookie),
 * falling back to localStorage.
 */
export function getUserFromClientCookie(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = document.cookie
      .split("; ")
      .find((r) => r.startsWith("user="))
      ?.split("=")
      .slice(1)
      .join("=");
    if (raw) return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    // fall through
  }
  return getCurrentUser();
}
