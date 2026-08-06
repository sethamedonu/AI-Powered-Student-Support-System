"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { conversationsApi } from "@/lib/api";
import { timeAgo, truncate } from "@/lib/utils";
import type { Conversation, User } from "@/lib/types";

const CATEGORIES = [
  {
    label: "Admissions",
    value: "admissions",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    icon_color: "text-blue-600 dark:text-blue-400",
    border_hover: "hover:border-blue-200 dark:hover:border-blue-800",
  },
  {
    label: "Registration",
    value: "registration",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    icon_color: "text-emerald-600 dark:text-emerald-400",
    border_hover: "hover:border-emerald-200 dark:hover:border-emerald-800",
  },
  {
    label: "Tuition",
    value: "tuition",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    icon_color: "text-orange-600 dark:text-orange-400",
    border_hover: "hover:border-orange-200 dark:hover:border-orange-800",
  },
  {
    label: "Examinations",
    value: "examinations",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    icon_color: "text-purple-600 dark:text-purple-400",
    border_hover: "hover:border-purple-200 dark:hover:border-purple-800",
  },
  {
    label: "Scholarships",
    value: "scholarships",
    icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z",
    bg: "bg-yellow-50 dark:bg-yellow-950/50",
    icon_color: "text-yellow-600 dark:text-yellow-400",
    border_hover: "hover:border-yellow-200 dark:hover:border-yellow-800",
  },
  {
    label: "Campus Services",
    value: "campus-services",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    bg: "bg-teal-50 dark:bg-teal-950/50",
    icon_color: "text-teal-600 dark:text-teal-400",
    border_hover: "hover:border-teal-200 dark:hover:border-teal-800",
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
          <div className="h-7 w-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="h-2.5 w-14 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function DashboardClient({ user }: { user: User }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conversationsApi
      .list(5)
      .then((r) => setConversations(r.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalConvs = conversations.length;
  const totalMessages = conversations.reduce((s, c) => s + c.messageCount, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 animate-fade-in lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400">
            Good {getGreeting()}
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Hello, {user.givenName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            What can I help you with today?
          </p>
        </div>
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/25 hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          New Chat
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Conversations" value={totalConvs} sub="all time" color="blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </StatCard>
            <StatCard label="Messages" value={totalMessages} sub="exchanged" color="green">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
            </StatCard>
            <StatCard label="AI Model" value="Nova Lite" sub="active" color="purple">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </StatCard>
            <StatCard label="Support" value="24/7" sub="always available" color="orange">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </StatCard>
          </>
        )}
      </div>

      {/* Quick-start categories */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Ask about
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/chat?category=${cat.value}`}
              className={[
                "group flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                "dark:border-white/5 dark:bg-slate-900",
                cat.border_hover,
              ].join(" ")}
            >
              {/* Tinted icon background */}
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cat.bg} transition-transform group-hover:scale-110`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${cat.icon_color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
                </svg>
              </span>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent conversations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Recent conversations
          </h2>
          <Link
            href="/conversations"
            className="text-xs font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded dark:text-primary-400"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center dark:border-white/10 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">No conversations yet.</p>
            <Link href="/chat" className="mt-2 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Start your first chat →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.conversationId}
                href={`/conversations/${conv.conversationId}`}
                className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-white/5 dark:bg-slate-900 dark:hover:border-primary-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {truncate(conv.title, 55)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {conv.messageCount} messages · {timeAgo(conv.lastMessageAt)}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-3 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
