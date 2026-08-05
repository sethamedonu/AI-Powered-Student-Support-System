"use server";

import { redirect } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface RegisterInput {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
  studentId?: string;
}

export async function registerAction(
  data: RegisterInput,
): Promise<
  | { error: string; fieldErrors?: Record<string, string>; redirectTo?: never }
  | { redirectTo: string; error?: never }
  | undefined
> {
  // Basic validation
  const fieldErrors: Record<string, string> = {};
  if (!data.givenName) fieldErrors["givenName"] = "First name is required";
  if (!data.familyName) fieldErrors["familyName"] = "Last name is required";
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    fieldErrors["email"] = "Enter a valid email";
  if (!data.password || data.password.length < 8)
    fieldErrors["password"] = "Password must be at least 8 characters";
  else if (!/[A-Z]/.test(data.password))
    fieldErrors["password"] = "Must contain an uppercase letter";
  else if (!/[0-9]/.test(data.password))
    fieldErrors["password"] = "Must contain a number";
  else if (!/[^A-Za-z0-9]/.test(data.password))
    fieldErrors["password"] = "Must contain a special character";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = (await res.json()) as {
    success: boolean;
    error?: { message: string };
  };

  if (!res.ok || !json.success) {
    return {
      error: json.error?.message ?? "Registration failed. Please try again.",
    };
  }

  redirect(`/auth/verify?email=${encodeURIComponent(data.email)}`);
}
