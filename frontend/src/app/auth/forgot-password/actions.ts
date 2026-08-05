"use server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function forgotPasswordAction(
  email: string,
): Promise<{ error: string; redirectTo?: never } | { redirectTo: string; error?: never }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  // Fire-and-forget — never reveal if email exists (prevents enumeration)
  await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => {});

  return { redirectTo: `/auth/reset-password?email=${encodeURIComponent(email)}` };
}
