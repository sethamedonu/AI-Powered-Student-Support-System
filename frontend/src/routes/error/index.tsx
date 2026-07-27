import { component$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';

export default component$(() => {
  const loc = useLocation();
  const is404 = loc.url.pathname.includes('404');

  return (
    <div class="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div class="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 class="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
        {is404 ? 'Page not found' : 'Something went wrong'}
      </h1>
      <p class="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {is404
          ? "The page you're looking for doesn't exist or has been moved."
          : 'An unexpected error occurred. Please try again or return to the dashboard.'}
      </p>
      <div class="mt-8 flex items-center gap-3">
        <Link href="/dashboard" class="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
          Go to dashboard
        </Link>
        <button
          type="button"
          onClick$={() => window.history.back()}
          class="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Go back
        </button>
      </div>
    </div>
  );
});
