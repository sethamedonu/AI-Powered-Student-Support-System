"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { verifyAction } from "./actions";

export function VerifyForm({ email }: { email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await verifyAction(
        email,
        data.get("code") as string,
      );
      if (result?.error) setError(result.error);
      if (result?.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 01-2-2H5a2 2 0 01-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white">
          Check your email
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          We sent a 6-digit code to{" "}
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
          label="Verification code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          required
        />
        <Button type="submit" fullWidth loading={isPending} size="lg">
          Verify email
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Didn&apos;t receive a code?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Go back
        </Link>
      </p>
    </div>
  );
}
