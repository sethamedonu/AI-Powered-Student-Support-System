import { component$ } from '@builder.io/qwik';
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

export const useRegisterAction = routeAction$(
  async (data, { redirect }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          givenName: data.givenName,
          familyName: data.familyName,
          studentId: data.studentId || undefined,
        }),
      },
    );

    const json = (await res.json()) as {
      success: boolean;
      data?: { userId: string; email: string };
      error?: { message: string };
    };

    if (!res.ok || !json.success) {
      return { success: false as const, error: json.error?.message ?? 'Registration failed. Please try again.' };
    }

    throw redirect(302, `/auth/verify?email=${encodeURIComponent(data.email)}`);
  },
  zod$({
    givenName: z.string().min(1, 'First name is required'),
    familyName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    studentId: z.string().optional(),
  }),
);

export default component$(() => {
  const action = useRegisterAction();

  return (
    <AuthLayout>
      <div class="space-y-7">
        <div>
          <h2 class="font-display text-3xl font-bold text-slate-900 dark:text-white">Create your account</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Join thousands of students getting instant support
          </p>
        </div>

        {action.value?.success === false && (
          <Alert variant="error">{action.value.error}</Alert>
        )}

        <form method="post" class="space-y-5">
          <div class="grid grid-cols-2 gap-3">
            <Input label="First name" name="givenName" type="text" autoComplete="given-name" placeholder="Jane" error={action.value?.fieldErrors?.['givenName']?.[0]} required />
            <Input label="Last name" name="familyName" type="text" autoComplete="family-name" placeholder="Doe" error={action.value?.fieldErrors?.['familyName']?.[0]} required />
          </div>
          <Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@university.edu" error={action.value?.fieldErrors?.['email']?.[0]} required />
          <Input label="Student ID" name="studentId" type="text" placeholder="e.g. STU-2024-001 (optional)" error={action.value?.fieldErrors?.['studentId']?.[0]} />
          <Input label="Password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" hint="Min 8 chars, uppercase, number, and special character" error={action.value?.fieldErrors?.['password']?.[0]} required />
          <Button type="submit" fullWidth loading={action.isRunning}>Create account</Button>
        </form>

        <p class="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link href="/auth/login" class="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
});

export const head: DocumentHead = {
  title: 'Create Account — AI Student Support',
  meta: [{ name: 'description', content: 'Create your student support account' }],
};
