"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { Spinner } from "@/components/ui/Spinner";
import { conversationsApi } from "@/lib/api";
import { getInitials } from "@/lib/auth";
import { formatDate, truncate } from "@/lib/utils";
import type { Conversation, Message, User } from "@/lib/types";

interface Props {
  user: User;
  conversationId: string;
}

export function ConversationDetailClient({ user, conversationId }: Props) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    conversationsApi
      .get(conversationId)
      .then((r) => {
        setConversation(r.conversation);
        setMessages(r.messages.items);
      })
      .catch(() => setError("Failed to load conversation."))
      .finally(() => setLoading(false));
  }, [conversationId]);

  const initials = getInitials(user);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <Link
          href="/conversations"
          aria-label="Back to history"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white">
            {conversation ? truncate(conversation.title, 60) : "Conversation"}
          </h1>
          {conversation && (
            <p className="text-xs text-slate-400">
              {conversation.messageCount} messages · {formatDate(conversation.createdAt)}
            </p>
          )}
        </div>
        {conversation && (
          <Link
            href={`/chat?conversationId=${conversationId}`}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Continue chat
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-red-500">{error}</p>
              <Link href="/conversations" className="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700">Back to history</Link>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.messageId} message={msg} userInitials={initials} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
