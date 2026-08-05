"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { resetPasswordAction } from "./actions";

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await resetPasswordAction({
        email,
        code: data.get("code") as string,
        newPassword: data.get("newPassword") as string,
        confirmPassword: data.get("confirmPassword") as string,
      });
      if (result?.error) setError(result.error);
      if (result && "fieldErrors" in result && result.fieldErrors)
        setFieldErrors(result.fieldErrors);
      if (result && "redirectTo" in result && result.redirectTo)
        router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white">
          Set new password
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Enter the code sent to{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {email || "your email"}
          </span>
        </p>
      </div>

      {error && (
        <Alert variant="error">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9 3.75l-7.89 5.26A1.5 1.5 0 0112 18V6a1.5 1.5 0 00-2.25-1.333L3 9.75V18h18z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.878 9.878l4.242 4.242m0 0L12 16.242m4.122-4.122L12 7.758m4.122 4.122z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Reset code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          error={fieldErrors["code"]}
          required
        />

        <PasswordInput
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Min 8 chars, uppercase, number, and special character"
          error={fieldErrors["newPassword"]}
          required
        />

        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          error={fieldErrors["confirmPassword"]}
          required
        />

        <Button type="submit" fullWidth loading={isPending} size="lg">
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
