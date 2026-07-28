import { component$, Slot } from '@builder.io/qwik';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorMap = {
  blue:   'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
  purple: 'bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
  orange: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
};

export const StatCard = component$<StatCardProps>(({ label, value, sub, color = 'blue' }) => (
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-white/5 dark:bg-slate-900">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
        <p class="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && <p class="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      <div class={`rounded-xl p-2.5 ${colorMap[color]}`}>
        <Slot />
      </div>
    </div>
  </div>
));
