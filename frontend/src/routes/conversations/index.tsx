import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { Link, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';
import { conversationsApi } from '~/lib/api';
import { requireAuth } from '~/lib/auth';
import { timeAgo, truncate, formatDate } from '~/lib/utils';
import type { Conversation } from '~/lib/types';

export const useAuthGuard = routeLoader$(async (event) => {
  return requireAuth(event);
});

export default component$(() => {
  const conversations = useSignal<Conversation[]>([]);
  const loading = useSignal(true);
  const deletingId = useSignal<string | null>(null);
  const error = useSignal('');

  useVisibleTask$(async () => {
    try {
      const result = await conversationsApi.list(50);
      conversations.value = result.items;
    } catch {
      error.value = 'Failed to load conversations.';
    } finally {
      loading.value = false;
    }
  });

  const deleteConversation = $(async (conversationId: string) => {
    deletingId.value = conversationId;
    try {
      await conversationsApi.delete(conversationId);
      conversations.value = conversations.value.filter(c => c.conversationId !== conversationId);
    } catch {
      error.value = 'Failed to delete conversation.';
    } finally {
      deletingId.value = null;
    }
  });

  return (
    <AppLayout>
      <div class="mx-auto max-w-3xl space-y-6 p-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Conversation History</h1>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {conversations.value.length} conversation{conversations.value.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/chat"
            class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </Link>
        </div>

        {error.value && (
          <div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error.value}
          </div>
        )}

        {/* List */}
        {loading.value ? (
          <div class="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} class="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : conversations.value.length === 0 ? (
          <div class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p class="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No conversations yet</p>
            <p class="mt-1 text-sm text-slate-400">Start chatting to see your history here.</p>
            <Link href="/chat" class="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Start your first chat →
            </Link>
          </div>
        ) : (
          <div class="space-y-2">
            {conversations.value.map(conv => (
              <div
                key={conv.conversationId}
                class="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition-all hover:border-primary-200 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-800"
              >
                {/* Icon */}
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-950">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>

                {/* Content */}
                <Link
                  href={`/conversations/${conv.conversationId}`}
                  class="min-w-0 flex-1"
                >
                  <p class="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                    {truncate(conv.title, 60)}
                  </p>
                  <p class="mt-0.5 text-xs text-slate-400">
                    {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''} · {timeAgo(conv.lastMessageAt)} · {formatDate(conv.createdAt)}
                  </p>
                </Link>

                {/* Delete */}
                <button
                  type="button"
                  onClick$={() => deleteConversation(conv.conversationId)}
                  disabled={deletingId.value === conv.conversationId}
                  class="shrink-0 rounded-lg p-2 text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed dark:text-slate-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                  aria-label="Delete conversation"
                >
                  {deletingId.value === conv.conversationId ? (
                    <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
});

export const head: DocumentHead = {
  title: 'Conversation History — AI Student Support',
};
