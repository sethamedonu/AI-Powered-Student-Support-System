"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { timeAgo } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
  userInitials: string;
}

// Custom renderers — no @tailwindcss/typography dependency needed
const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-base font-bold text-slate-900 dark:text-white first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-3 text-sm font-bold text-slate-900 dark:text-white first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200 first:mt-0">{children}</h3>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-700">
          <code className="text-slate-800 dark:text-slate-100">{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono text-primary-700 dark:bg-slate-700 dark:text-primary-300">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-600 dark:border-slate-600 dark:text-slate-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-600 underline hover:text-primary-700 dark:text-primary-400"
    >
      {children}
    </a>
  ),
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy message"
      className="flex h-6 w-6 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

export function ChatMessage({ message, userInitials }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
          isUser
            ? "bg-primary-600 text-white shadow-sm shadow-primary-600/30"
            : "bg-gradient-to-br from-indigo-100 to-purple-100 text-primary-600 dark:from-indigo-900/60 dark:to-purple-900/60 dark:text-primary-300",
        ].join(" ")}
      >
        {isUser ? (
          userInitials
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] space-y-1.5 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={[
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary-600 text-white shadow-sm shadow-primary-600/20"
              : "rounded-tl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/5",
          ].join(" ")}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs text-slate-400">{timeAgo(message.createdAt)}</span>
          {!isUser && message.model && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
              {message.model}
            </span>
          )}
          {!isUser && message.cacheStatus === "hit" && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              cached
            </span>
          )}
          {!isUser && (
            <CopyButton text={message.content} />
          )}
        </div>
      </div>
    </div>
  );
}
