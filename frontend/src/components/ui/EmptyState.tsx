import { component$, Slot } from '@builder.io/qwik';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export const EmptyState = component$<EmptyStateProps>(({
  title,
  description,
  icon = 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}) => (
  <div class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d={icon} />
      </svg>
    </div>
    <p class="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
    {description && (
      <p class="mt-1 text-sm text-slate-400 dark:text-slate-500">{description}</p>
    )}
    <div class="mt-4">
      <Slot />
    </div>
  </div>
));
