import { component$ } from '@builder.io/qwik';
import { Link, routeAction$, z, zod$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AuthLayout } from '~/components/layout/AuthLayout';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Alert } from '~/components/ui/Alert';

export const useForgotPasswordAction = routeAction$(
  async (data, { redirect }) => {
    await fetch(
      `${process.env['PUBLIC_API_URL'] ?? 'http://localhost:3000'}/auth/forgot-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      },
    );
    // Always redirect — prevents email enumeration
    throw redirect(302, `/auth/reset-password?email=${encodeURIComponent(data.email)}`);
  },
  zod$({ email: z.string().email('Enter a valid email') }),
);

export default component$(() => {
  const action = useForgotPasswordAction();

  return (
    <AuthLayout>
      <div class="space-y-6">
        <div>
          <Link href="/auth/login" class="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to sign in
          </Link>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Reset your password</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter your email and we'll send you a reset code.
          </p>
        </div>

        {action.value?.failed && action.value.fieldErrors?.['email'] && (
          <Alert variant="error">{action.value.fieldErrors['email']?.[0]}</Alert>
        )}

        <form method="post" class="space-y-4">
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            error={action.value?.fieldErrors?.['email']?.[0]}
            required
          />
          <Button type="submit" fullWidth loading={action.isRunning}>
            Send reset code
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
});

export const head: DocumentHead = {
  title: 'Forgot Password — AI Student Support',
};
