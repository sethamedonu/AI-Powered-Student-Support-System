import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Link, useLocation, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';
import { ChatMessage } from '~/components/chat/ChatMessage';
import { conversationsApi } from '~/lib/api';
import { getInitials, requireAuth } from '~/lib/auth';
import { formatDate, truncate } from '~/lib/utils';
import type { Conversation, Message, User } from '~/lib/types';

export const useAuthGuard = routeLoader$(async (event) => {
  return requireAuth(event);
});

export default component$(() => {
  const loc = useLocation();
  const conversationId = loc.params['conversationId'];

  const user = useSignal<User | null>(null);
  const conversation = useSignal<Conversation | null>(null);
  const messages = useSignal<Message[]>([]);
  const loading = useSignal(true);
  const error = useSignal('');

  useVisibleTask$(async () => {
    // Load user
    try {
      const raw = document.cookie.split('; ').find(r => r.startsWith('user='))?.split('=').slice(1).join('=');
      if (raw) user.value = JSON.parse(decodeURIComponent(raw)) as User;
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) user.value = JSON.parse(stored) as User;
    }

    // Load conversation + messages
    try {
      const result = await conversationsApi.get(conversationId);
      conversation.value = result.conversation;
      messages.value = result.messages.items;
    } catch {
      error.value = 'Failed to load conversation.';
    } finally {
      loading.value = false;
    }
  });

  const initials = user.value ? getInitials(user.value) : 'U';

  return (
    <AppLayout>
      <div class="flex h-full flex-col">
        {/* Header */}
        <div class="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
          <Link
            href="/conversations"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Back to history"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-base font-semibold text-slate-900 dark:text-white">
              {conversation.value ? truncate(conversation.value.title, 60) : 'Conversation'}
            </h1>
            {conversation.value && (
              <p class="text-xs text-slate-400">
                {conversation.value.messageCount} messages · {formatDate(conversation.value.createdAt)}
              </p>
            )}
          </div>
          {conversation.value && (
            <Link
              href={`/chat?conversationId=${conversationId}`}
              class="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Continue chat
            </Link>
          )}
        </div>

        {/* Messages */}
        <div class="flex-1 overflow-y-auto px-6 py-6">
          {loading.value ? (
            <div class="mx-auto max-w-3xl space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} class={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div class="h-8 w-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                  <div class={`h-16 w-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800`} />
                </div>
              ))}
            </div>
          ) : error.value ? (
            <div class="flex h-full items-center justify-center">
              <div class="text-center">
                <p class="text-sm text-red-500">{error.value}</p>
                <Link href="/conversations" class="mt-2 inline-block text-sm text-primary-600 hover:text-primary-700">
                  Back to history
                </Link>
              </div>
            </div>
          ) : (
            <div class="mx-auto max-w-3xl space-y-6">
              {messages.value.map(msg => (
                <ChatMessage key={msg.messageId} message={msg} userInitials={initials} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
});

export const head: DocumentHead = {
  title: 'Conversation — AI Student Support',
};
