import { AppLayout } from "@/components/layout/AppLayout";

// Shared layout for all authenticated app routes
export default function AppRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
