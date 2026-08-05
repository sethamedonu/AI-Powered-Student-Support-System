import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export const metadata: Metadata = { title: "Reset Password" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <AuthLayout>
      <ResetPasswordForm email={params["email"] ?? ""} />
    </AuthLayout>
  );
}
