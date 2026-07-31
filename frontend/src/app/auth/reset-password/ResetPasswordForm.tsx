"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
      if (result?.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result?.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Set new password
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter the code sent to{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {email || "your email"}
          </span>
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Input
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Min 8 chars, uppercase, number, and special character"
          error={fieldErrors["newPassword"]}
          required
        />
        <Input
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={fieldErrors["confirmPassword"]}
          required
        />
        <Button type="submit" fullWidth loading={isPending}>
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
