import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { Link, routeLoader$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';
import { Spinner } from '~/components/ui/Spinner';
import { adminApi } from '~/lib/api';
import { requireAdmin } from '~/lib/auth';
import { formatDate } from '~/lib/utils';

// Server-side guard: unauthenticated → /auth/login, non-admin → /dashboard
export const useAdminGuard = routeLoader$(async (event) => {
  return requireAdmin(event);
});

type Period = 'day' | 'week' | 'month';

interface MetricRow {
  date: string;
  messages: number;
  cacheHits: number;
  aiCalls: number;
}

interface AnalyticsData {
  period: string;
  metrics: MetricRow[];
  topCategories: { category: string; count: number }[];
  modelUsage: { model: string; count: number }[];
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Today', value: 'day' },
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
];

export default component$(() => {
  const period = useSignal<Period>('week');
  const data = useSignal<AnalyticsData | null>(null);
  const loading = useSignal(true);
  const error = useSignal('');

  const loadData = $(async (p: Period) => {
    loading.value = true;
    error.value = '';
    try {
      data.value = await adminApi.getAnalytics(p);
    } catch {
      error.value = 'Failed to load analytics data.';
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadData(period.value);
  });

  const totalMessages = data.value?.metrics.reduce((s, r) => s + r.messages, 0) ?? 0;
  const totalCacheHits = data.value?.metrics.reduce((s, r) => s + r.cacheHits, 0) ?? 0;
  const totalAiCalls = data.value?.metrics.reduce((s, r) => s + r.aiCalls, 0) ?? 0;
  const cacheRate = totalMessages > 0 ? Math.round((totalCacheHits / totalMessages) * 100) : 0;
  const maxMessages = Math.max(...(data.value?.metrics.map(r => r.messages) ?? [1]), 1);
  const maxCategoryCount = Math.max(...(data.value?.topCategories.map(c => c.count) ?? [1]), 1);
  const totalModelUsage = data.value?.modelUsage.reduce((s, m) => s + m.count, 0) ?? 1;

  return (
    <AppLayout>
      <div class="mx-auto max-w-5xl space-y-8 p-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <Link href="/admin" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
            </div>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Usage metrics and AI performance
            </p>
          </div>

          {/* Period selector */}
          <div class="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            {PERIODS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick$={async () => {
                  period.value = p.value;
                  await loadData(p.value);
                }}
                class={[
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  period.value === p.value
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error.value && (
          <div class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error.value}
          </div>
        )}

        {loading.value ? (
          <div class="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Total messages', value: totalMessages, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
                { label: 'Cache hits', value: totalCacheHits, color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400' },
                { label: 'AI calls', value: totalAiCalls, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400' },
                { label: 'Cache hit rate', value: `${cacheRate}%`, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400' },
              ].map(card => (
                <div key={card.label} class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                  <p class="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                  <p class={`mt-1 text-2xl font-bold ${card.color.split(' ')[0]}`}>{card.value}</p>
                </div>
              ))}
            </div>

            {/* Message volume chart (bar chart using CSS) */}
            <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 class="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Message volume</h2>
              {data.value?.metrics.length === 0 ? (
                <p class="py-8 text-center text-sm text-slate-400">No data for this period.</p>
              ) : (
                <div class="space-y-2">
                  {data.value?.metrics.map(row => (
                    <div key={row.date} class="flex items-center gap-3">
                      <span class="w-20 shrink-0 text-right text-xs text-slate-400">
                        {formatDate(row.date)}
                      </span>
                      <div class="flex flex-1 items-center gap-2">
                        <div class="flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" style="height: 20px;">
                          <div
                            class="h-full rounded-full bg-primary-500 transition-all"
                            style={`width: ${Math.round((row.messages / maxMessages) * 100)}%`}
                          />
                        </div>
                        <span class="w-8 shrink-0 text-right text-xs font-medium text-slate-600 dark:text-slate-400">
                          {row.messages}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top categories */}
              <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <h2 class="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Top question categories</h2>
                {data.value?.topCategories.length === 0 ? (
                  <p class="py-4 text-center text-sm text-slate-400">No data yet.</p>
                ) : (
                  <div class="space-y-3">
                    {data.value?.topCategories.map((cat, i) => (
                      <div key={cat.category}>
                        <div class="mb-1 flex items-center justify-between">
                          <span class="text-sm capitalize text-slate-700 dark:text-slate-300">
                            {cat.category.replace(/-/g, ' ')}
                          </span>
                          <span class="text-xs text-slate-400">{cat.count}</span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            class={`h-full rounded-full transition-all ${
                              i === 0 ? 'bg-primary-500' :
                              i === 1 ? 'bg-blue-400' :
                              i === 2 ? 'bg-green-400' :
                              'bg-slate-400'
                            }`}
                            style={`width: ${Math.round((cat.count / maxCategoryCount) * 100)}%`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Model usage */}
              <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
                <h2 class="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">AI model usage</h2>
                {data.value?.modelUsage.length === 0 ? (
                  <p class="py-4 text-center text-sm text-slate-400">No data yet.</p>
                ) : (
                  <div class="space-y-4">
                    {data.value?.modelUsage.map(m => {
                      const pct = Math.round((m.count / totalModelUsage) * 100);
                      return (
                        <div key={m.model}>
                          <div class="mb-1 flex items-center justify-between">
                            <span class="text-sm text-slate-700 dark:text-slate-300">{m.model}</span>
                            <span class="text-xs text-slate-400">{pct}% · {m.count} calls</span>
                          </div>
                          <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              class={`h-full rounded-full transition-all ${
                                m.model.includes('nova') ? 'bg-green-500' : 'bg-purple-500'
                              }`}
                              style={`width: ${pct}%`}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Cost insight */}
                    <div class="mt-4 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-950">
                      <p class="text-xs font-medium text-green-700 dark:text-green-300">
                        💡 Cache saved ~{totalCacheHits} AI calls this period
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Raw metrics table */}
            <div class="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div class="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 class="text-sm font-semibold text-slate-800 dark:text-slate-200">Detailed metrics</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-slate-100 dark:border-slate-800">
                      {['Date', 'Messages', 'Cache hits', 'AI calls', 'Cache rate'].map(h => (
                        <th key={h} class="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.value?.metrics.map(row => {
                      const rate = row.messages > 0 ? Math.round((row.cacheHits / row.messages) * 100) : 0;
                      return (
                        <tr key={row.date} class="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td class="px-5 py-3 text-slate-700 dark:text-slate-300">{formatDate(row.date)}</td>
                          <td class="px-5 py-3 font-medium text-slate-900 dark:text-white">{row.messages}</td>
                          <td class="px-5 py-3 text-green-600 dark:text-green-400">{row.cacheHits}</td>
                          <td class="px-5 py-3 text-purple-600 dark:text-purple-400">{row.aiCalls}</td>
                          <td class="px-5 py-3">
                            <span class={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              rate >= 70
                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : rate >= 40
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
});

export const head: DocumentHead = {
  title: 'Analytics — AI Student Support',
};
