"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { forgotPasswordAction } from "./actions";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await forgotPasswordAction(
        data.get("email") as string,
      );
      if (result?.error) setError(result.error);
      if (result?.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/auth/login"
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>
         <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Enter your email and we&apos;ll send you a reset code.
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
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          required
        />
        <Button type="submit" fullWidth loading={isPending} size="lg">
          Send reset code
        </Button>
      </form>
    </div>
  );
}
