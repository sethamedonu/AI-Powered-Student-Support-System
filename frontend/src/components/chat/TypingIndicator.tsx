import { component$ } from '@builder.io/qwik';

export const TypingIndicator = component$(() => (
  <div class="flex gap-3">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
    <div class="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <span class="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
      <span class="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
      <span class="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
    </div>
  </div>
));
