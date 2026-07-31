"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
      if (result && "fieldErrors" in result && result.fieldErrors) setFieldErrors(result.fieldErrors);
      if (result && "redirectTo" in result && result.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Join thousands of students getting instant support
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
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
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="Min 8 chars, uppercase, number, and special character"
          error={fieldErrors["password"]}
          required
        />
        <Button type="submit" fullWidth loading={isPending}>
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
