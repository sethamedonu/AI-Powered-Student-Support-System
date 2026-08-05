"use server";

import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface LoginSuccess {
  ok: true;
  redirectTo: string;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
  user: unknown;
}
interface LoginFailure {
  ok: false;
  error: string;
}

/**
 * Server action: validate credentials, set auth cookies, then RETURN tokens
 * to the client so LoginForm can also persist them to localStorage.
 *
 * This dual approach is required because:
 * - Cookies  → used by Next.js middleware + server components for SSR auth guards
 * - localStorage → used by api.ts to attach Authorization: Bearer <idToken>
 *   on every client-side fetch (API Gateway Cognito Authorizer requires the idToken)
 */
export async function loginAction(
  email: string,
  password: string,
  redirectTo?: string,
): Promise<LoginSuccess | LoginFailure> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const json = (await res.json()) as {
    success: boolean;
    data?: {
      user: unknown;
      tokens: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
      };
    };
    error?: { message: string };
  };

  if (!res.ok || !json.success) {
    return {
      ok: false,
      error: json.error?.message ?? "Invalid email or password",
    };
  }

  const { tokens, user } = json.data!;
  const cookieStore = await cookies();

  // Set cookies for SSR auth guards (middleware + server components)
  cookieStore.set("accessToken", tokens.accessToken, {
    path: "/",
    httpOnly: false, // must be readable by JS for logout helpers
    maxAge: 3600,
    sameSite: "lax",
  });
  cookieStore.set("refreshToken", tokens.refreshToken, {
    path: "/",
    httpOnly: false,
    maxAge: 2592000,
    sameSite: "lax",
  });
  cookieStore.set("user", encodeURIComponent(JSON.stringify(user)), {
    path: "/",
    httpOnly: false,
    maxAge: 3600,
    sameSite: "lax",
  });

  // Return tokens + user to the client — LoginForm will write them
  // to localStorage so client-side API calls can send Bearer tokens
  return {
    ok: true,
    redirectTo: redirectTo ?? "/dashboard",
    tokens,
    user,
  };
}
