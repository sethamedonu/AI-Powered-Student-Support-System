import { component$, Slot } from '@builder.io/qwik';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  variant?: AlertVariant;
}

const styles: Record<AlertVariant, string> = {
  error: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
  success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300',
  info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300',
};

export const Alert = component$<AlertProps>(({ variant = 'info' }) => {
  return (
    <div class={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
      <Slot />
    </div>
  );
});
