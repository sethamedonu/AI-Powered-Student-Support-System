import { component$, Slot, type PropsOf } from '@builder.io/qwik';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = PropsOf<'button'> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary:
    'bg-primary-600 text-white shadow-sm shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-700/30 focus-visible:ring-primary-500 disabled:bg-primary-300 disabled:shadow-none',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
  ghost:
    'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400 dark:text-slate-300 dark:hover:bg-slate-800',
  danger:
    'bg-red-600 text-white shadow-sm shadow-red-600/25 hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-300',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = component$<ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, class: cls, ...props }) => {
    return (
      <button
        {...props}
        disabled={props.disabled || loading}
        class={[
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
          'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variantClass[variant],
          sizeClass[size],
          fullWidth ? 'w-full' : '',
          cls as string,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {loading && (
          <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        <Slot />
      </button>
    );
  },
);
