"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { saveTokens, saveUser } from "@/lib/api";
import type { User } from "@/lib/types";
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
  const [rememberMe, setRememberMe] = useState(false);

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

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Persist tokens + user to localStorage so client-side API calls
      // can attach Authorization: Bearer <idToken> to every request.
      // (The server action already set the cookies for SSR guards.)
      saveTokens({
        accessToken: result.tokens.accessToken,
        idToken: result.tokens.idToken,
        refreshToken: result.tokens.refreshToken,
      });
      saveUser(result.user as User);

      router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-8">
      <div className="text-center lg:text-left">
        <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white">
          Welcome back
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Sign in to your student account
        </p>
      </div>

      {verified && (
        <Alert variant="success">
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
                d="M9 12.75L11.25 15 15 9.75M20.25 12c0 4.418-4.03 8-9 8a9.857 9.857 0 01-4.067-.862L3 20.25l.862-4.067A9.955 9.955 0 0112 3.75c5.073 0 9.25 3.84 9.25 8.75z"
              />
            </svg>
            <span>Email verified! You can now sign in.</span>
          </div>
        </Alert>
      )}
      {reset && (
        <Alert variant="success">
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
                d="M9 12.75L11.25 15 15 9.75M20.25 12c0 4.418-4.03 8-9 8a9.857 9.857 0 01-4.067-.862L3 20.25l.862-4.067A9.955 9.955 0 0112 3.75c5.073 0 9.25 3.84 9.25 8.75z"
              />
            </svg>
            <span>Password reset successfully. Sign in with your new password.</span>
          </div>
        </Alert>
      )}
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pw-password"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Remember me
            </span>
          </label>
        </div>

        <Button type="submit" fullWidth loading={isPending} size="lg">
          Sign in
        </Button>
      </form>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Create one
        </Link>
      </div>
    </div>
  );
}
