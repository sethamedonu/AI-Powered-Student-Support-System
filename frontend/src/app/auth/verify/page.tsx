import type { Metadata } from "next";
import { VerifyForm } from "./VerifyForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export const metadata: Metadata = { title: "Verify Email" };

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function VerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <AuthLayout>
      <VerifyForm email={params["email"] ?? ""} />
    </AuthLayout>
  );
}
