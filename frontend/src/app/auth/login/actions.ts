"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function loginAction(
  email: string,
  password: string,
  redirectTo?: string,
): Promise<{ error: string; redirectTo?: never } | { redirectTo: string; error?: never } | undefined> {
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
      error: json.error?.message ?? "Invalid email or password",
    };
  }

  const { tokens, user } = json.data!;
  const cookieStore = await cookies();

  cookieStore.set("accessToken", tokens.accessToken, {
    path: "/",
    httpOnly: false,
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

  redirect(redirectTo ?? "/dashboard");
}
