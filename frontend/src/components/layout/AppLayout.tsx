"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { getUserFromClientCookie } from "@/lib/auth.client";
import type { User } from "@/lib/types";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setUser(getUserFromClientCookie());
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user} isDark={isDark} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
