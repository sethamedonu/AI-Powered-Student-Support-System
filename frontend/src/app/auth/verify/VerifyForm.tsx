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
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Check your email
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {email || "your email"}
          </span>
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Button type="submit" fullWidth loading={isPending}>
          Verify email
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Didn&apos;t receive a code?{" "}
        <Link
          href="/auth/register"
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Go back
        </Link>
      </p>
    </div>
  );
}
