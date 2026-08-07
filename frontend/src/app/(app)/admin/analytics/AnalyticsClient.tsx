"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { adminApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type Period = "day" | "week" | "month";

interface MetricRow { date: string; messages: number; cacheHits: number; aiCalls: number; }
interface AnalyticsData {
  period: string;
  metrics: MetricRow[];
  topCategories: { category: string; count: number }[];
  modelUsage: { model: string; count: number }[];
}

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "day" },
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
];

export function AnalyticsClient() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (p: Period) => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.getAnalytics(p));
    } catch (err: any) {
      console.error('Analytics API error:', err);
      const msg = err.message || "Failed to load analytics data.";
      setError(err.status === 401 ? "Unauthorized. Please log in as admin." : msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(period); }, [loadData, period]);

  const totalMessages = data?.metrics.reduce((s, r) => s + r.messages, 0) ?? 0;
  const totalCacheHits = data?.metrics.reduce((s, r) => s + r.cacheHits, 0) ?? 0;
  const totalAiCalls = data?.metrics.reduce((s, r) => s + r.aiCalls, 0) ?? 0;
  const cacheRate = totalMessages > 0 ? Math.round((totalCacheHits / totalMessages) * 100) : 0;
  const maxMessages = Math.max(...(data?.metrics.map((r) => r.messages) ?? [1]), 1);
  const maxCategoryCount = Math.max(...(data?.topCategories.map((c) => c.count) ?? [1]), 1);
  const totalModelUsage = data?.modelUsage.reduce((s, m) => s + m.count, 0) ?? 1;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-lg text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:hover:text-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Usage metrics and AI performance</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={["rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400", period === p.value ? "bg-primary-600 text-white" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"].join(" ")}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950 dark:text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total messages", value: totalMessages, cls: "text-blue-600" },
              { label: "Cache hits", value: totalCacheHits, cls: "text-green-600" },
              { label: "AI calls", value: totalAiCalls, cls: "text-purple-600" },
              { label: "Cache hit rate", value: `${cacheRate}%`, cls: "text-orange-600" },
            ].map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className={`mt-1 text-2xl font-bold ${card.cls}`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Message volume bar chart */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Message volume</h2>
            {data?.metrics.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No data for this period.</p>
            ) : (
              <div className="space-y-2">
                {data?.metrics.map((row) => (
                  <div key={row.date} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-right text-xs text-slate-400">{formatDate(row.date)}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" style={{ height: 20 }}>
                        <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${Math.round((row.messages / maxMessages) * 100)}%` }} />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs font-medium text-slate-600 dark:text-slate-400">{row.messages}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top categories */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">Top question categories</h2>
              {data?.topCategories.length === 0 ? <p className="py-4 text-center text-sm text-slate-400">No data yet.</p> : (
                <div className="space-y-3">
                  {data?.topCategories.map((cat, i) => (
                    <div key={cat.category}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm capitalize text-slate-700 dark:text-slate-300">{cat.category.replace(/-/g, " ")}</span>
                        <span className="text-xs text-slate-400">{cat.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full transition-all ${i === 0 ? "bg-primary-500" : i === 1 ? "bg-blue-400" : i === 2 ? "bg-green-400" : "bg-slate-400"}`} style={{ width: `${Math.round((cat.count / maxCategoryCount) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Model usage */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-200">AI model usage</h2>
              {data?.modelUsage.length === 0 ? <p className="py-4 text-center text-sm text-slate-400">No data yet.</p> : (
                <div className="space-y-4">
                  {data?.modelUsage.map((m) => {
                    const pct = Math.round((m.count / totalModelUsage) * 100);
                    return (
                      <div key={m.model}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{m.model}</span>
                          <span className="text-xs text-slate-400">{pct}% · {m.count} calls</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className={`h-full rounded-full transition-all ${m.model.includes("nova") ? "bg-green-500" : "bg-purple-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-950">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">
                      💡 Cache saved ~{totalCacheHits} AI calls this period
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metrics table */}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Detailed metrics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    {["Date", "Messages", "Cache hits", "AI calls", "Cache rate"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.metrics.map((row) => {
                    const rate = row.messages > 0 ? Math.round((row.cacheHits / row.messages) * 100) : 0;
                    return (
                      <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-5 py-3 text-slate-700 dark:text-slate-300">{formatDate(row.date)}</td>
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{row.messages}</td>
                        <td className="px-5 py-3 text-green-600 dark:text-green-400">{row.cacheHits}</td>
                        <td className="px-5 py-3 text-purple-600 dark:text-purple-400">{row.aiCalls}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rate >= 70 ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : rate >= 40 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"}`}>{rate}%</span>
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
  );
}
