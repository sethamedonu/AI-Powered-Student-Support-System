import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { redirectIfAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign In" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  await redirectIfAuthenticated(params);

  return (
    <AuthLayout>
      <LoginForm
        verified={params["verified"] === "1"}
        reset={params["reset"] === "1"}
        redirectTo={params["redirect"]}
      />
    </AuthLayout>
  );
}
