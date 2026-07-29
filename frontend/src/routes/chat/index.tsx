import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';
import { ChatMessage } from '~/components/chat/ChatMessage';
import { TypingIndicator } from '~/components/chat/TypingIndicator';
import { chatApi } from '~/lib/api';
import { getInitials } from '~/lib/auth';
import type { Message, User, KnowledgeCategory } from '~/lib/types';

const CATEGORIES: { label: string; value: KnowledgeCategory }[] = [
  { label: 'General', value: 'general' },
  { label: 'Admissions', value: 'admissions' },
  { label: 'Registration', value: 'registration' },
  { label: 'Tuition', value: 'tuition' },
  { label: 'Exams', value: 'examinations' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Graduation', value: 'graduation' },
  { label: 'Scholarships', value: 'scholarships' },
  { label: 'Campus', value: 'campus-services' },
];

const SUGGESTIONS = [
  'What are the admission requirements?',
  'How do I register for courses?',
  'When is the tuition payment deadline?',
  'What scholarships are available?',
];

export default component$(() => {
  const loc = useLocation();
  const user = useSignal<User | null>(null);
  const messages = useSignal<Message[]>([]);
  const conversationId = useSignal<string | undefined>(undefined);
  const input = useSignal('');
  const isTyping = useSignal(false);
  const error = useSignal('');
  const category = useSignal<KnowledgeCategory>(
    (loc.url.searchParams.get('category') as KnowledgeCategory) ?? 'general',
  );
  const messagesEndRef = useSignal<Element>();

  useVisibleTask$(() => {
    try {
      const raw = document.cookie.split('; ').find(r => r.startsWith('user='))?.split('=').slice(1).join('=');
      if (raw) user.value = JSON.parse(decodeURIComponent(raw)) as User;
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) user.value = JSON.parse(stored) as User;
    }
  });

  const scrollToBottom = $(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
  });

  const sendMessage = $(async () => {
    const text = input.value.trim();
    if (!text || isTyping.value) return;

    error.value = '';
    input.value = '';

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      conversationId: conversationId.value ?? '',
      messageId: tempId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    messages.value = [...messages.value, userMsg];
    isTyping.value = true;
    await scrollToBottom();

    try {
      const result = await chatApi.sendMessage({
        message: text,
        conversationId: conversationId.value,
        category: category.value,
      });

      conversationId.value = result.conversationId;

      // Replace temp user message with real one and add assistant response
      const assistantMsg: Message = {
        conversationId: result.conversationId,
        messageId: result.messageId,
        role: 'assistant',
        content: result.answer,
        model: result.model,
        cacheStatus: result.cacheStatus,
        tokensUsed: result.tokensUsed,
        latencyMs: result.latencyMs,
        createdAt: new Date().toISOString(),
      };
      messages.value = [...messages.value, assistantMsg];
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to send message. Please try again.';
      // Remove the optimistic user message on failure
      messages.value = messages.value.filter(m => m.messageId !== tempId);
    } finally {
      isTyping.value = false;
      await scrollToBottom();
    }
  });

  const handleKeyDown = $((e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  const initials = user.value ? getInitials(user.value) : 'U';
  const isEmpty = messages.value.length === 0;

  return (
    <AppLayout>
      <div class="flex h-full flex-col">
        {/* Header */}
        <div class="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-slate-900">
          <div>
            <h1 class="font-display text-lg font-bold text-slate-900 dark:text-white">AI Chat</h1>
            <p class="text-xs text-slate-400">Powered by Amazon Bedrock</p>
          </div>
          {conversationId.value && (
            <button
              type="button"
              onClick$={() => {
                messages.value = [];
                conversationId.value = undefined;
                error.value = '';
              }}
              class="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:hover:border-primary-700 dark:hover:text-primary-400"
            >
              + New conversation
            </button>
          )}
        </div>

        {/* Category selector */}
        <div class="flex gap-2 overflow-x-auto border-b border-slate-100 bg-white px-6 py-3 dark:border-white/5 dark:bg-slate-900">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              type="button"
              onClick$={() => (category.value = cat.value)}
              class={[
                'shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all',
                category.value === cat.value
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/25'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10',
              ].join(' ')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Messages area */}
        <div class="flex-1 overflow-y-auto px-6 py-6">
          {isEmpty ? (
            <div class="flex h-full flex-col items-center justify-center text-center">
              <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-950">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 class="mt-4 text-lg font-semibold text-slate-800 dark:text-white">How can I help you?</h2>
              <p class="mt-1 max-w-sm text-sm text-slate-500">
                Ask me anything about admissions, courses, tuition, exams, or campus services.
              </p>
              <div class="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick$={() => { input.value = s; }}
                    class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600 transition-all hover:border-primary-300 hover:text-primary-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-primary-700 dark:hover:text-primary-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div class="mx-auto max-w-3xl space-y-6">
              {messages.value.map(msg => (
                <ChatMessage key={msg.messageId} message={msg} userInitials={initials} />
              ))}
              {isTyping.value && <TypingIndicator />}
              {error.value && (
                <div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                  {error.value}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div class="border-t border-slate-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-slate-900">
          <div class="mx-auto max-w-3xl">
            <div class="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:border-white/10 dark:bg-white/5 dark:focus-within:ring-primary-900/40">
              <textarea
                value={input.value}
                onInput$={(e) => (input.value = (e.target as HTMLTextAreaElement).value)}
                onKeyDown$={handleKeyDown}
                placeholder="Ask a question about admissions, courses, tuition..."
                rows={1}
                class="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                style="max-height: 120px; overflow-y: auto;"
              />
              <button
                type="button"
                onClick$={sendMessage}
                disabled={!input.value.trim() || isTyping.value}
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/30 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p class="mt-2 text-center text-xs text-slate-400">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
});

export const head: DocumentHead = {
  title: 'AI Chat — AI Student Support',
  meta: [{ name: 'description', content: 'Chat with your AI student support assistant' }],
};
