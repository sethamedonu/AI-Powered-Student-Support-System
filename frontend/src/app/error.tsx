"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-slate-900 dark:text-white">
          Error
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Something went wrong
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
          {error.message}
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-block rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
