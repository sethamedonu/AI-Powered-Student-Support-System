"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DocumentManager } from "./DocumentManager";
import type { User, UserRole } from "@/lib/types";

interface AdminStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  cacheHitRate: number;
  avgLatencyMs: number;
  activeToday: number;
}

interface FeedbackItem {
  feedbackId: string;
  rating: number;
  category: string;
  comment: string;
  createdAt: string;
}

const STARS = [1, 2, 3, 4, 5];

// ─── Role toggle button ───────────────────────────────────────────────────────
function RoleToggleButton({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: (updated: User) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isAdmin = user.role === "admin";
  const targetRole: UserRole = isAdmin ? "student" : "admin";
  const action = isAdmin ? "Demote to student" : "Promote to admin";
  const actionShort = isAdmin ? "Demote" : "Promote";

  function handleClick() {
    setConfirmOpen(true);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      try {
        const updated = await adminApi.updateUser(user.userId, { role: targetRole });
        onUpdated(updated);
      } catch {
        // silently fail — user sees no change
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title={action}
        className={[
          "rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
          isAdmin
            ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            : "bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-purple-950 dark:hover:text-purple-400",
        ].join(" ")}
      >
        {isPending ? (
          <span className="flex items-center gap-1">
            <Spinner size="sm" />
            {actionShort}…
          </span>
        ) : (
          actionShort
        )}
      </button>

      {/* Confirmation dialog */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {isAdmin ? "Demote to student?" : "Promote to admin?"}
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {isAdmin
                ? `${user.givenName} ${user.familyName} will lose admin access immediately.`
                : `${user.givenName} ${user.familyName} will gain full admin access including user management, analytics, and knowledge base editing.`}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
                  isAdmin
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-purple-600 hover:bg-purple-700",
                ].join(" ")}
              >
                {action}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.listUsers(10),
      adminApi.listFeedback(5),
    ])
      .then(([s, u, f]) => {
        setStats(s);
        setUsers(u.items);
        setFeedback(f.items as FeedbackItem[]);
      })
      .catch(() => setError("Failed to load admin data."))
      .finally(() => setLoading(false));
  }, []);

  function handleUserUpdated(updated: User) {
    setUsers((prev) =>
      prev.map((u) => (u.userId === updated.userId ? updated : u)),
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            System overview and management
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          View analytics
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total users" value={stats?.totalUsers ?? 0} color="blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </StatCard>
            <StatCard label="Conversations" value={stats?.totalConversations ?? 0} color="green">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </StatCard>
            <StatCard label="Messages" value={stats?.totalMessages ?? 0} color="purple">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            </StatCard>
            <StatCard label="Cache hit rate" value={`${stats?.cacheHitRate ?? 0}%`} color="green">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </StatCard>
            <StatCard label="Avg latency" value={`${stats?.avgLatencyMs ?? 0}ms`} color="orange">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </StatCard>
            <StatCard label="Active today" value={stats?.activeToday ?? 0} color="blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
            </StatCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Users table with role management */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    User management
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Promote or demote user roles
                  </p>
                </div>
                <span className="text-xs text-slate-400">{users.length} shown</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    No users found.
                  </p>
                ) : (
                  users.map((u) => (
                    <div key={u.userId} className="flex items-center gap-3 px-5 py-3">
                      {/* Avatar */}
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                        {u.givenName[0]}
                        {u.familyName[0]}
                      </div>

                      {/* Name + email */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {u.givenName} {u.familyName}
                        </p>
                        <p className="truncate text-xs text-slate-400">{u.email}</p>
                      </div>

                      {/* Role badge + toggle button */}
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                        <RoleToggleButton user={u} onUpdated={handleUserUpdated} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent feedback */}
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Recent feedback
                </h2>
                <span className="text-xs text-slate-400">{feedback.length} shown</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {feedback.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">
                    No feedback yet.
                  </p>
                ) : (
                  feedback.map((f) => (
                    <div key={f.feedbackId} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {STARS.map((s) => (
                            <svg
                              key={s}
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-3.5 w-3.5 ${
                                s <= f.rating
                                  ? "text-yellow-400"
                                  : "text-slate-200 dark:text-slate-700"
                              }`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-xs capitalize text-slate-400">
                            {f.category.replace("-", " ")}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatDate(f.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                        {f.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Knowledge Base document management */}
          <DocumentManager />
        </>
      )}
    </div>
  );
}
