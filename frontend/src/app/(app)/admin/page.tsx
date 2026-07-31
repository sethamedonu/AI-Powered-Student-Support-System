import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  await requireAdmin();
  return <AdminClient />;
}
