import { component$ } from '@builder.io/qwik';
import type { Message } from '~/lib/types';
import { timeAgo } from '~/lib/utils';

interface ChatMessageProps {
  message: Message;
  userInitials: string;
}

export const ChatMessage = component$<ChatMessageProps>(({ message, userInitials }) => {
  const isUser = message.role === 'user';

  return (
    <div class={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div class={[
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
        isUser
          ? 'bg-primary-600 text-white'
          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
      ].join(' ')}>
        {isUser ? userInitials : (
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div class={`max-w-[75%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div class={[
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-primary-600 text-white'
            : 'rounded-tl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
        ].join(' ')}>
          {message.content}
        </div>

        {/* Meta */}
        <div class={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span class="text-xs text-slate-400">{timeAgo(message.createdAt)}</span>
          {!isUser && message.model && (
            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-700">
              {message.model}
            </span>
          )}
          {!isUser && message.cacheStatus === 'hit' && (
            <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600 dark:bg-green-950 dark:text-green-400">
              cached
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
