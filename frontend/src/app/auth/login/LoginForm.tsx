"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { loginAction } from "./actions";

interface LoginFormProps {
  verified?: boolean;
  reset?: boolean;
  redirectTo?: string;
}

export function LoginForm({ verified, reset, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(
        data.get("email") as string,
        data.get("password") as string,
        redirectTo,
      );
      if (result?.error) {
        setError(result.error);
      }
      // On success the server action redirects — no client-side redirect needed.
      // But if running in an environment where redirect() doesn't work from the
      // client context, fall back:
      if (result?.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in to your student account
        </p>
      </div>

      {verified && (
        <Alert variant="success">
          Email verified! You can now sign in.
        </Alert>
      )}
      {reset && (
        <Alert variant="success">
          Password reset successfully. Sign in with your new password.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          required
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pw-password"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="pw-password"
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        <Button type="submit" fullWidth loading={isPending}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
