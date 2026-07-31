import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearTokens, saveTokens, authApi } from "./api";
import type { User } from "./types";

// ─── Server-side guards ───────────────────────────────────────────────────────
// These run in Server Components, Server Actions, or middleware.
// They use next/headers cookies() — not available in Client Components.

/**
 * Read the user object stored in the cookie set at login.
 * Call from async Server Components or Server Actions.
 */
export async function getUserFromCookie(): Promise<User | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("user")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    return null;
  }
}

/**
 * Guard for protected pages.
 * Redirects to /auth/login if the accessToken cookie is missing.
 * Returns the authenticated user.
 *
 * Usage in async Server Components:
 *   const user = await requireAuth();
 */
export async function requireAuth(returnPath?: string): Promise<User> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    const path = returnPath ?? "/auth/login";
    const redirectTo = returnPath
      ? `/auth/login?redirect=${encodeURIComponent(returnPath)}`
      : "/auth/login";
    redirect(redirectTo);
  }

  const user = await getUserFromCookie();
  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

/**
 * Admin-only guard. Redirects non-admins to /dashboard.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Guard for auth pages (login, register, etc.).
 * If already logged in, redirects to /dashboard or the ?redirect param.
 */
export async function redirectIfAuthenticated(
  searchParams: Record<string, string | undefined>,
): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (token) {
    const returnTo = searchParams["redirect"];
    redirect(returnTo ?? "/dashboard");
  }
}

// ─── Client-side helpers ──────────────────────────────────────────────────────
// These are safe to call from Client Components (browser only).

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
  // Clear cookies too
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

// ─── Display helpers ──────────────────────────────────────────────────────────

export function getInitials(user: User): string {
  return `${user.givenName[0] ?? ""}${user.familyName[0] ?? ""}`.toUpperCase();
}

export function getFullName(user: User): string {
  return `${user.givenName} ${user.familyName}`;
}

/**
 * Read the user cookie on the client side (from document.cookie).
 * Used in Client Components where server cookies() is unavailable.
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
    // fall through to localStorage
  }
  return getCurrentUser();
}
