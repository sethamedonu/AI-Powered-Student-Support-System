import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';

export default component$(() => (
  <AppLayout>
    <div class="p-6">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
      <p class="mt-1 text-sm text-slate-500">Coming in Milestone 5e.</p>
    </div>
  </AppLayout>
));

export const head: DocumentHead = { title: 'Dashboard — AI Student Support' };
