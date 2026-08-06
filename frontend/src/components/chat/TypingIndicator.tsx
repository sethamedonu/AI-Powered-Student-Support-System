export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      {/* AI avatar — matches ChatMessage assistant style */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-primary-600 dark:from-indigo-900/60 dark:to-purple-900/60 dark:text-primary-300">
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
      </div>

      {/* Bubble */}
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-5 py-3.5 shadow-sm ring-1 ring-slate-100 dark:bg-slate-800 dark:ring-white/5">
        <span className="h-2 w-2 rounded-full bg-primary-400 opacity-60 animate-bounce [animation-delay:-0.32s]" />
        <span className="h-2 w-2 rounded-full bg-primary-400 opacity-75 animate-bounce [animation-delay:-0.16s]" />
        <span className="h-2 w-2 rounded-full bg-primary-400 animate-bounce" />
        <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">AI is thinking…</span>
      </div>
    </div>
  );
}
