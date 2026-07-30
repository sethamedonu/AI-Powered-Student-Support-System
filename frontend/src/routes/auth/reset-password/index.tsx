import { component$ } from '@builder.io/qwik';
import { Link, routeAction$, routeLoader$, z, zod$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AuthLayout } from '~/components/layout/AuthLayout';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Alert } from '~/components/ui/Alert';

export const useEmailLoader = routeLoader$(({ query }) => ({
  email: query.get('email') ?? '',
}));

export const useResetPasswordAction = routeAction$(
  async (data, { redirect }) => {
    if (data.newPassword !== data.confirmPassword) {
      return { success: false as const, error: 'Passwords do not match.' };
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/reset-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, code: data.code, newPassword: data.newPassword }),
      },
    );

    const json = (await res.json()) as { success: boolean; error?: { message: string } };

    if (!res.ok || !json.success) {
      return { success: false as const, error: json.error?.message ?? 'Reset failed. Check your code and try again.' };
    }

    throw redirect(302, '/auth/login?reset=1');
  },
  zod$({
    email: z.string().email(),
    code: z.string().min(6).max(6),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  }),
);

export default component$(() => {
  const action = useResetPasswordAction();
  const { email } = useEmailLoader().value;

  return (
    <AuthLayout>
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Set new password</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter the code sent to{' '}
            <span class="font-medium text-slate-700 dark:text-slate-300">{email || 'your email'}</span>
          </p>
        </div>

        {action.value?.success === false && (
          <Alert variant="error">{action.value.error}</Alert>
        )}

        <form method="post" class="space-y-4">
          <input type="hidden" name="email" value={email} />

          <Input
            label="Reset code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            error={action.value?.fieldErrors?.['code']?.[0]}
            required
          />

          <Input
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            hint="Min 8 chars, uppercase, number, and special character"
            error={action.value?.fieldErrors?.['newPassword']?.[0]}
            required
          />

          <Input
            label="Confirm new password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={action.value?.fieldErrors?.['confirmPassword']?.[0]}
            required
          />

          <Button type="submit" fullWidth loading={action.isRunning}>
            Reset password
          </Button>
        </form>

        <p class="text-center text-sm text-slate-500 dark:text-slate-400">
          Remember your password?{' '}
          <Link href="/auth/login" class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});

export const head: DocumentHead = {
  title: 'Reset Password — AI Student Support',
};
