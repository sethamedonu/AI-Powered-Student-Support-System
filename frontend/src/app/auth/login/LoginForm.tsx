"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [showPassword, setShowPassword] = useState(false);

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
              htmlFor="password"
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
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:focus:ring-primary-900/40"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
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
