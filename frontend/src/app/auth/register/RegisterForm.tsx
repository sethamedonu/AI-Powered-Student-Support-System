"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { registerAction } from "./actions";

export function RegisterForm() {
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
      const result = await registerAction({
        email: data.get("email") as string,
        password: data.get("password") as string,
        givenName: data.get("givenName") as string,
        familyName: data.get("familyName") as string,
        studentId: (data.get("studentId") as string) || undefined,
      });
      if (result?.error) setError(result.error);
      if (result && "fieldErrors" in result && result.fieldErrors)
        setFieldErrors(result.fieldErrors);
      if (result && "redirectTo" in result && result.redirectTo)
        router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="font-display text-4xl font-bold text-slate-900 dark:text-white">
          Create your account
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Join thousands of students getting instant support
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
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            name="givenName"
            type="text"
            autoComplete="given-name"
            placeholder="Jane"
            error={fieldErrors["givenName"]}
            required
          />
          <Input
            label="Last name"
            name="familyName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            error={fieldErrors["familyName"]}
            required
          />
        </div>

        <Input
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          error={fieldErrors["email"]}
          required
        />

        <Input
          label="Student ID"
          name="studentId"
          type="text"
          placeholder="e.g. STU-2024-001 (optional)"
          error={fieldErrors["studentId"]}
        />

        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Min 8 chars, uppercase, number, and special character"
          error={fieldErrors["password"]}
          required
        />

        <Button type="submit" fullWidth loading={isPending} size="lg">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
