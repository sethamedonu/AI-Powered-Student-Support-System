import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AnalyticsClient } from "./AnalyticsClient";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await requireAdmin();
  return <AnalyticsClient />;
}
