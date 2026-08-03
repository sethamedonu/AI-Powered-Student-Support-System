/**
 * auth.ts — server-side auth guards only.
 *
 * ONLY import this from:
 *   - async Server Components
 *   - Server Actions
 *   - Route Handlers
 *
 * Do NOT import this from Client Components — it uses next/headers
 * which is server-only. For client-side helpers use auth.client.ts.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "./types";

/**
 * Read the user object stored in the cookie set at login.
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
 * Guard for protected pages — redirects to /auth/login if unauthenticated.
 */
export async function requireAuth(returnPath?: string): Promise<User> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
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
 * Admin-only guard — redirects non-admins to /dashboard.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/**
 * Guard for auth pages — redirects authenticated users to /dashboard.
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
