import { component$, useSignal } from '@builder.io/qwik';
import { Link, routeAction$, routeLoader$, z, zod$ } from '@builder.io/qwik-city';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AuthLayout } from '~/components/layout/AuthLayout';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Alert } from '~/components/ui/Alert';
import { redirectIfAuthenticated } from '~/lib/auth';

export const useGuestGuard = routeLoader$(async (event) => {
  redirectIfAuthenticated(event);
});

export const useLoginAction = routeAction$(
  async (data, { cookie, redirect }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      },
    );

    const json = (await res.json()) as {
      success: boolean;
      data?: { user: unknown; tokens: { accessToken: string; idToken: string; refreshToken: string } };
      error?: { message: string };
    };

    if (!res.ok || !json.success) {
      return { success: false as const, error: json.error?.message ?? 'Invalid email or password' };
    }

    const { tokens, user } = json.data!;
    cookie.set('accessToken', tokens.accessToken, { path: '/', httpOnly: false, maxAge: 3600 });
    cookie.set('refreshToken', tokens.refreshToken, { path: '/', httpOnly: false, maxAge: 2592000 });
    cookie.set('user', JSON.stringify(user), { path: '/', httpOnly: false, maxAge: 3600 });

    throw redirect(302, '/dashboard');
  },
  zod$({
    email: z.string().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
);

export default component$(() => {
  const action = useLoginAction();
  const showPassword = useSignal(false);

  return (
    <AuthLayout>
      <div class="space-y-7">
        <div>
          <h2 class="font-display text-3xl font-bold text-slate-900 dark:text-white">Welcome back</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Sign in to your student account</p>
        </div>

        {action.value?.success === false && (
          <Alert variant="error">{action.value.error}</Alert>
        )}

        <form method="post" class="space-y-5">
          <Input
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@university.edu"
            error={action.value?.fieldErrors?.['email']?.[0]}
            required
          />

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label for="password" class="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link href="/auth/forgot-password" class="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                Forgot password?
              </Link>
            </div>
            <div class="relative">
              <input
                id="password"
                name="password"
                type={showPassword.value ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                class={[
                  'w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-all',
                  'bg-white text-slate-900 placeholder:text-slate-400',
                  'dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500',
                  action.value?.fieldErrors?.['password']
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-slate-700 dark:focus:ring-primary-900/40',
                ].join(' ')}
              />
              <button
                type="button"
                onClick$={() => (showPassword.value = !showPassword.value)}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={showPassword.value ? 'Hide password' : 'Show password'}
              >
                {showPassword.value ? (
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {action.value?.fieldErrors?.['password'] && (
              <p class="text-xs text-red-500">{action.value.fieldErrors['password']?.[0]}</p>
            )}
          </div>

          <Button type="submit" fullWidth loading={action.isRunning}>
            Sign in
          </Button>
        </form>

        <p class="text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link href="/auth/register" class="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
});

export const head: DocumentHead = {
  title: 'Sign In — AI Student Support',
  meta: [{ name: 'description', content: 'Sign in to your student support account' }],
};
