"use server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function verifyAction(
  email: string,
  code: string,
): Promise<{ error: string; redirectTo?: never } | { redirectTo: string; error?: never }> {
  if (!code || code.length !== 6) {
    return { error: "Enter the 6-digit verification code." };
  }

  const res = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  const json = (await res.json()) as {
    success: boolean;
    error?: { message: string };
  };

  if (!res.ok || !json.success) {
    return {
      error: json.error?.message ?? "Invalid or expired code.",
    };
  }

  return { redirectTo: "/auth/login?verified=1" };
}
