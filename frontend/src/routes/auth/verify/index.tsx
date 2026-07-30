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

export const useVerifyAction = routeAction$(
  async (data, { redirect }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/verify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, code: data.code }),
      },
    );

    const json = (await res.json()) as {
      success: boolean;
      error?: { message: string };
    };

    if (!res.ok || !json.success) {
      return { success: false as const, error: json.error?.message ?? 'Invalid or expired code.' };
    }

    throw redirect(302, '/auth/login?verified=1');
  },
  zod$({
    email: z.string().email(),
    code: z.string().min(6, 'Enter the 6-digit code').max(6),
  }),
);

export default component$(() => {
  const action = useVerifyAction();
  const { email } = useEmailLoader().value;

  return (
    <AuthLayout>
      <div class="space-y-6">
        <div>
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Check your email</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            We sent a 6-digit code to{' '}
            <span class="font-medium text-slate-700 dark:text-slate-300">{email || 'your email'}</span>
          </p>
        </div>

        {action.value?.success === false && (
          <Alert variant="error">{action.value.error}</Alert>
        )}

        <form method="post" class="space-y-4">
          <input type="hidden" name="email" value={email} />

          <Input
            label="Verification code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            error={action.value?.fieldErrors?.['code']?.[0]}
            required
          />

          <Button type="submit" fullWidth loading={action.isRunning}>
            Verify email
          </Button>
        </form>

        <p class="text-center text-sm text-slate-500 dark:text-slate-400">
          Didn't receive a code?{' '}
          <Link
            href={`/auth/register`}
            class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Go back
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});

export const head: DocumentHead = {
  title: 'Verify Email — AI Student Support',
};
