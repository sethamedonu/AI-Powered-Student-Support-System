import { component$, type PropsOf } from '@builder.io/qwik';

type InputProps = PropsOf<'input'> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Input = component$<InputProps>(({ label, error, hint, id, class: cls, ...props }) => {
  const inputId = id ?? `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div class="flex flex-col gap-1">
      {label && (
        <label for={inputId} class="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        class={[
          'w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'bg-white text-slate-900 placeholder:text-slate-400',
          'dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900'
            : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-600 dark:focus:ring-primary-900',
          cls as string,
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {error && <p class="text-xs text-red-500">{error}</p>}
      {hint && !error && <p class="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
});
