"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { conversationsApi } from "@/lib/api";
import { timeAgo, truncate, formatDate } from "@/lib/utils";
import type { Conversation } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";

export function ConversationsClient() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    conversationsApi
      .list(50)
      .then((r) => setConversations(r.items))
      .catch(() => setError("Failed to load conversations."))
      .finally(() => setLoading(false));
  }, []);

  async function deleteConversation(id: string) {
    setDeletingId(id);
    try {
      await conversationsApi.delete(id);
      setConversations((prev) => prev.filter((c) => c.conversationId !== id));
    } catch {
      setError("Failed to delete conversation.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Conversation History</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/chat" className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          New Chat
        </Link>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No conversations yet</p>
          <p className="mt-1 text-sm text-slate-400">Start chatting to see your history here.</p>
          <Link href="/chat" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">Start your first chat →</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.conversationId}
              className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition-all hover:border-primary-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <Link href={`/conversations/${conv.conversationId}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{truncate(conv.title, 60)}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""} · {timeAgo(conv.lastMessageAt)} · {formatDate(conv.createdAt)}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => deleteConversation(conv.conversationId)}
                disabled={deletingId === conv.conversationId}
                aria-label="Delete conversation"
                className="shrink-0 rounded-lg p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed dark:text-slate-600 dark:hover:bg-red-950 dark:hover:text-red-400"
              >
                {deletingId === conv.conversationId ? (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
