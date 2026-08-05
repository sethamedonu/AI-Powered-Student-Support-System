import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { FeedbackClient } from "./FeedbackClient";

export const metadata: Metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  await requireAuth("/feedback");
  return <FeedbackClient />;
}
