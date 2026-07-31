import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireAuth("/dashboard");
  return <DashboardClient user={user} />;
}
