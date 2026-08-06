"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { chatApi, conversationsApi } from "@/lib/api";
import { getInitials } from "@/lib/auth.client";
import { uid } from "@/lib/utils";
import type { KnowledgeCategory, Message, User } from "@/lib/types";

const CATEGORIES: { label: string; value: KnowledgeCategory; icon: string }[] = [
  { label: "General", value: "general", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Admissions", value: "admissions", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { label: "Registration", value: "registration", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Tuition", value: "tuition", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Exams", value: "examinations", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Calendar", value: "calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { label: "Graduation", value: "graduation", icon: "M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.477 10-10 10S1 18.523 1 13c0-.85.1-1.678.29-2.472L12 14z" },
  { label: "Scholarships", value: "scholarships", icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" },
  { label: "Campus", value: "campus-services", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
];

const CATEGORY_SUGGESTIONS: Record<KnowledgeCategory, string[]> = {
  general: [
    "How do I contact student services?",
    "Where can I find campus maps?",
    "What resources are available for students?",
    "How do I access the student portal?",
  ],
  admissions: [
    "What are the admission requirements?",
    "When is the application deadline?",
    "How do I submit my transcripts?",
    "What documents do I need for admission?",
  ],
  registration: [
    "How do I register for courses?",
    "When does registration open?",
    "How do I drop or add a class?",
    "What if a course is full?",
  ],
  tuition: [
    "When is the tuition payment deadline?",
    "What payment methods are accepted?",
    "How do I set up a payment plan?",
    "Can I get a tuition refund?",
  ],
  examinations: [
    "When are final exams?",
    "Where do I find my exam schedule?",
    "What do I do if I miss an exam?",
    "How do I request exam accommodations?",
  ],
  calendar: [
    "When does the semester start?",
    "What are the important academic dates?",
    "When is spring break?",
    "When do grades get posted?",
  ],
  graduation: [
    "What are the graduation requirements?",
    "How do I apply for graduation?",
    "When is the graduation ceremony?",
    "How do I order my diploma?",
  ],
  scholarships: [
    "What scholarships are available?",
    "How do I apply for financial aid?",
    "When is the scholarship deadline?",
    "What are the scholarship requirements?",
  ],
  "campus-services": [
    "Where is the library located?",
    "What dining options are available?",
    "How do I access campus WiFi?",
    "Where can I park on campus?",
  ],
};

export function ChatClient({
  user,
  initialCategory,
}: {
  user: User;
  initialCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(
    searchParams?.get("id") ?? undefined,
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory>(
    (initialCategory as KnowledgeCategory) ?? "general",
  );
  const [categoryNotification, setCategoryNotification] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss category notification after 3 seconds
  useEffect(() => {
    if (categoryNotification) {
      const timer = setTimeout(() => setCategoryNotification(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [categoryNotification]);

  // Load conversation messages on mount if conversationId exists
  useEffect(() => {
    const loadConversation = async () => {
      const id = searchParams?.get("id");
      if (!id) return;

      setIsLoading(true);
      setError("");
      try {
        const result = await conversationsApi.get(id);
        setMessages(result.messages.items);
        setConversationId(id);
      } catch (e) {
        console.error("Failed to load conversation:", e);
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load conversation. Starting a new one.",
        );
        // Clear invalid conversation ID from URL
        router.replace("/chat");
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [searchParams, router]);

  const scrollToBottom = () =>
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );

  const handleCategoryChange = (newCategory: KnowledgeCategory) => {
    setCategory(newCategory);
    const categoryLabel = CATEGORIES.find((c) => c.value === newCategory)?.label || newCategory;
    setCategoryNotification(`Category changed to ${categoryLabel}`);
  };

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

      // Update URL with conversationId if this is a new conversation
      if (!conversationId) {
        setConversationId(result.conversationId);
        router.replace(`/chat?id=${result.conversationId}&category=${category}`);
      }

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
  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-slate-900">
        <div>
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white">AI Chat</h1>
          <p className="text-xs text-slate-400">Powered by Amazon Bedrock</p>
        </div>
        {conversationId && (
          <button
            type="button"
            onClick={() => { 
              setMessages([]); 
              setConversationId(undefined); 
              setError(""); 
              router.replace("/chat");
            }}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-primary-300 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-white/10 dark:hover:border-primary-700 dark:hover:text-primary-400"
          >
            + New conversation
          </button>
        )}
      </div>

      {/* Category selector */}
      <div className="border-b border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900">
        <div className="flex gap-2 overflow-x-auto px-6 py-3 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategoryChange(cat.value)}
              className={[
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                category === cat.value
                  ? "bg-primary-600 text-white shadow-sm shadow-primary-600/25 scale-105"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10",
              ].join(" ")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={cat.icon} />
              </svg>
              {cat.label}
            </button>
          ))}
        </div>
        
        {/* Category notification */}
        {categoryNotification && (
          <div className="animate-fade-in px-6 pb-3">
            <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{categoryNotification}</span>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-3 text-slate-500">
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Loading conversation...</span>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center animate-fade-in">
            {/* Animated icon */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-50 to-purple-50 shadow-sm dark:from-primary-950/60 dark:to-purple-950/60">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-100/50 to-purple-100/50 animate-pulse dark:from-primary-900/30 dark:to-purple-900/30" />
              <svg xmlns="http://www.w3.org/2000/svg" className="relative h-9 w-9 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORIES.find((c) => c.value === category)?.icon || "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"} />
              </svg>
            </div>
            <h2 className="mt-5 font-display text-xl font-bold text-slate-800 dark:text-white">
              Ask me anything about {CATEGORIES.find((c) => c.value === category)?.label.toLowerCase()}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Here are some questions you can ask to get started.
            </p>

            {/* Suggestion chips with icons */}
            <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CATEGORY_SUGGESTIONS[category].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left text-sm text-slate-600 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-primary-700 dark:hover:text-primary-300"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100 dark:bg-primary-950/60 dark:text-primary-400 dark:group-hover:bg-primary-900/60">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORIES.find((c) => c.value === category)?.icon || ""} />
                    </svg>
                  </span>
                  <span className="font-medium leading-snug">{suggestion}</span>
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
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950 dark:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
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
          <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:border-primary-700 dark:focus-within:ring-primary-900/30">
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/30 transition-all hover:bg-primary-700 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
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
