"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
          <div className="text-center">
            <h1 className="font-display text-6xl font-bold text-slate-900 dark:text-white">
              Error
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Something went wrong
            </p>
            <button
              onClick={reset}
              className="mt-6 inline-block rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
