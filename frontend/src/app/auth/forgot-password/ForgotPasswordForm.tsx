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
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reset your password
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter your email and we&apos;ll send you a reset code.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          required
        />
        <Button type="submit" fullWidth loading={isPending}>
          Send reset code
        </Button>
      </form>
    </div>
  );
}
