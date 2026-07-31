import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { redirectIfAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "Create Account" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;
  await redirectIfAuthenticated(params);
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
