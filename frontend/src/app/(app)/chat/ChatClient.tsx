"use client";

import { useRef, useState } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { chatApi } from "@/lib/api";
import { getInitials } from "@/lib/auth.client";
import { uid } from "@/lib/utils";
import type { KnowledgeCategory, Message, User } from "@/lib/types";

const CATEGORIES: { label: string; value: KnowledgeCategory }[] = [
  { label: "General", value: "general" },
  { label: "Admissions", value: "admissions" },
  { label: "Registration", value: "registration" },
  { label: "Tuition", value: "tuition" },
  { label: "Exams", value: "examinations" },
  { label: "Calendar", value: "calendar" },
  { label: "Graduation", value: "graduation" },
  { label: "Scholarships", value: "scholarships" },
  { label: "Campus", value: "campus-services" },
];

const SUGGESTIONS = [
  "What are the admission requirements?",
  "How do I register for courses?",
  "When is the tuition payment deadline?",
  "What scholarships are available?",
];

export function ChatClient({
  user,
  initialCategory,
}: {
  user: User;
  initialCategory: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>(
    (initialCategory as KnowledgeCategory) ?? "general",
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () =>
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError("");
    setInput("");

    const tempId = uid();
    const userMsg: Message = {
      conversationId: conversationId ?? "",
      messageId: tempId,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    scrollToBottom();

    try {
      const result = await chatApi.sendMessage({
        message: trimmed,
        conversationId,
        category,
      });
      setConversationId(result.conversationId);
      const assistantMsg: Message = {
        conversationId: result.conversationId,
        messageId: result.messageId,
        role: "assistant",
        content: result.answer,
        model: result.model,
        cacheStatus: result.cacheStatus,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to send message. Please try again.",
      );
      setMessages((prev) => prev.filter((m) => m.messageId !== tempId));
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const initials = getInitials(user);
  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-slate-900">
        <div>
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">AI Chat</h1>
          <p className="text-xs text-slate-400">Powered by Amazon Bedrock</p>
        </div>
        {conversationId && (
          <button
            type="button"
            onClick={() => { setMessages([]); setConversationId(undefined); setError(""); }}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-white/10"
          >
            + New conversation
          </button>
        )}
      </div>

      {/* Category selector */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-6 py-3 dark:border-white/5 dark:bg-slate-900">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setCategory(cat.value)}
            className={[
              "shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
              category === cat.value
                ? "bg-primary-600 text-white shadow-sm shadow-primary-600/25"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400",
            ].join(" ")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">How can I help you?</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Ask me anything about admissions, courses, tuition, exams, or campus services.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 transition-all hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.messageId} message={msg} userInitials={initials} />
            ))}
            {isTyping && <TypingIndicator />}
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:ring-primary-900/40">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about admissions, courses, tuition..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
              style={{ maxHeight: 120, overflowY: "auto" }}
            />
            <button
              type="button"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/30 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
