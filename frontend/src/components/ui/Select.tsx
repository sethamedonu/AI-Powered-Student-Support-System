import { component$, type PropsOf } from '@builder.io/qwik';

type SelectProps = PropsOf<'select'> & {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
};

export const Select = component$<SelectProps>(({ label, error, options, id, class: cls, ...props }) => {
  const inputId = id ?? `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div class="flex flex-col gap-1">
      {label && (
        <label for={inputId} class="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        {...props}
        id={inputId}
        class={[
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
            : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-600 dark:focus:ring-primary-900',
          cls as string,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p class="text-xs text-red-500">{error}</p>}
    </div>
  );
});
