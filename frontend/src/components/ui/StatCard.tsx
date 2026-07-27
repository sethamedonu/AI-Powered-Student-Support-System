import { component$, Slot } from '@builder.io/qwik';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
};

export const StatCard = component$<StatCardProps>(({ label, value, sub, color = 'blue' }) => (
  <div class="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && <p class="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      <div class={`rounded-lg p-2 ${colorMap[color]}`}>
        <Slot />
      </div>
    </div>
  </div>
));
