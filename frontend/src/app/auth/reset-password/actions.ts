"use server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

interface ResetInput {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export async function resetPasswordAction(
  data: ResetInput,
): Promise<
  | { error: string; fieldErrors?: Record<string, string>; redirectTo?: never }
  | { redirectTo: string; error?: never }
> {
  const fieldErrors: Record<string, string> = {};

  if (!data.code || data.code.length !== 6)
    fieldErrors["code"] = "Enter the 6-digit reset code";
  if (!data.newPassword || data.newPassword.length < 8)
    fieldErrors["newPassword"] = "Password must be at least 8 characters";
  else if (!/[A-Z]/.test(data.newPassword))
    fieldErrors["newPassword"] = "Must contain an uppercase letter";
  else if (!/[0-9]/.test(data.newPassword))
    fieldErrors["newPassword"] = "Must contain a number";
  else if (!/[^A-Za-z0-9]/.test(data.newPassword))
    fieldErrors["newPassword"] = "Must contain a special character";
  if (data.newPassword !== data.confirmPassword)
    fieldErrors["confirmPassword"] = "Passwords do not match";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: data.email,
      code: data.code,
      newPassword: data.newPassword,
    }),
  });

  const json = (await res.json()) as {
    success: boolean;
    error?: { message: string };
  };

  if (!res.ok || !json.success) {
    return {
      error: json.error?.message ?? "Reset failed. Check your code and try again.",
    };
  }

  return { redirectTo: "/auth/login?reset=1" };
}
