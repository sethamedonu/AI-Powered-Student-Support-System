import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireAuth("/profile");
  return <ProfileClient user={user} />;
}
