import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';

export default component$(() => (
  <div class="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
    <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <span class="text-4xl font-bold text-slate-400 dark:text-slate-500">404</span>
    </div>
    <h1 class="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Page not found</h1>
    <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <div class="mt-8 flex items-center gap-3">
      <Link href="/dashboard" class="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
        Go to dashboard
      </Link>
      <Link href="/auth/login" class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
        Sign in
      </Link>
    </div>
  </div>
));

export const head: DocumentHead = { title: '404 — Page Not Found' };
