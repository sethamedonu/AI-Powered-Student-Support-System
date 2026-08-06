"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";
import { getInitials, getFullName, logout } from "@/lib/auth.client";
import type { User } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/chat",
    label: "AI Chat",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    href: "/conversations",
    label: "History",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    href: "/feedback",
    label: "Feedback",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Admin",
    adminOnly: true,
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

interface SidebarProps {
  user: User | null;
  isDark: boolean;
}

export function Sidebar({ user, isDark }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard" || pathname === "/dashboard/"
      : pathname.startsWith(href);

  const navLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsOpen(false)}
        className={[
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
          active
            ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200",
        ].join(" ")}
      >
        {/* Left accent bar for active item */}
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary-600" />
        )}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${active ? "text-primary-600 dark:text-primary-400" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={active ? 2 : 1.75}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
        </svg>
        {item.label}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-600/30">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="relative h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.477 10-10 10S1 18.523 1 13c0-.85.1-1.678.29-2.472L12 14z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            AI Student
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 tracking-wide">
            Support System
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(navLink)}
        </div>

        {/* Admin section — only shown for admins */}
        {user?.role === "admin" && (
          <>
            <div className="my-3 border-t border-slate-100 dark:border-white/5" />
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              Admin
            </p>
            <div className="space-y-0.5">
              {ADMIN_NAV_ITEMS.map(navLink)}
            </div>
          </>
        )}
      </nav>

      {/* Bottom user row */}
      <div className="border-t border-slate-100 p-3 dark:border-white/5">
        <div className="flex items-center justify-between gap-2">
          {user && (
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar initials={getInitials(user)} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {getFullName(user)}
                </p>
                <p className="truncate text-xs capitalize text-slate-400">
                  {user.role}
                </p>
              </div>
            </div>
          )}
          <div className="flex shrink-0 items-center gap-1">
            <DarkModeToggle isDark={isDark} />
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-950/40"
              aria-label="Sign out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-white/5 dark:bg-slate-900 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm shadow-primary-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="relative h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            AI Student Support
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:bg-white/5"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 w-64 bg-white transition-transform dark:bg-slate-900 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
