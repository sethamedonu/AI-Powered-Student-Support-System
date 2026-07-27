import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { AppLayout } from '~/components/layout/AppLayout';
import { Avatar } from '~/components/ui/Avatar';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Alert } from '~/components/ui/Alert';
import { authApi } from '~/lib/api';
import { getInitials, getFullName } from '~/lib/auth';
import { formatDate } from '~/lib/utils';
import type { User } from '~/lib/types';

export default component$(() => {
  const user = useSignal<User | null>(null);

  // Change password form state
  const currentPassword = useSignal('');
  const newPassword = useSignal('');
  const confirmPassword = useSignal('');
  const pwLoading = useSignal(false);
  const pwError = useSignal('');
  const pwSuccess = useSignal(false);

  useVisibleTask$(() => {
    try {
      const raw = document.cookie.split('; ').find(r => r.startsWith('user='))?.split('=').slice(1).join('=');
      if (raw) user.value = JSON.parse(decodeURIComponent(raw)) as User;
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) user.value = JSON.parse(stored) as User;
    }
  });

  const handleChangePassword = async () => {
    pwError.value = '';
    pwSuccess.value = false;

    if (newPassword.value !== confirmPassword.value) {
      pwError.value = 'New passwords do not match.';
      return;
    }
    if (newPassword.value.length < 8) {
      pwError.value = 'Password must be at least 8 characters.';
      return;
    }

    pwLoading.value = true;
    try {
      // Uses forgot-password + reset flow since Cognito USER_PASSWORD_AUTH
      // change-password requires SRP. We trigger reset via the reset endpoint.
      await authApi.forgotPassword({ email: user.value!.email });
      pwSuccess.value = true;
      pwError.value = '';
      currentPassword.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
    } catch (e) {
      pwError.value = e instanceof Error ? e.message : 'Failed to initiate password change.';
    } finally {
      pwLoading.value = false;
    }
  };

  const u = user.value;

  return (
    <AppLayout>
      <div class="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account information</p>
        </div>

        {/* Profile card */}
        <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div class="flex items-center gap-4">
            {u ? (
              <Avatar initials={getInitials(u)} size="lg" />
            ) : (
              <div class="h-11 w-11 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            )}
            <div>
              <p class="text-lg font-semibold text-slate-900 dark:text-white">
                {u ? getFullName(u) : '—'}
              </p>
              <p class="text-sm text-slate-500 dark:text-slate-400">{u?.email ?? '—'}</p>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 dark:border-slate-800">
            {[
              { label: 'Role', value: u?.role ?? '—' },
              { label: 'Student ID', value: u?.studentId ?? 'Not set' },
              { label: 'Account status', value: u?.isActive ? 'Active' : 'Inactive' },
              { label: 'Member since', value: u ? formatDate(u.createdAt) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
                <p class="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change password */}
        <div class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 class="text-base font-semibold text-slate-900 dark:text-white">Change Password</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A reset code will be sent to your email address.
          </p>

          <div class="mt-5 space-y-4">
            {pwError.value && <Alert variant="error">{pwError.value}</Alert>}
            {pwSuccess.value && (
              <Alert variant="success">
                A password reset code has been sent to <strong>{u?.email}</strong>. Check your email to complete the change.
              </Alert>
            )}

            {!pwSuccess.value && (
              <>
                <Input
                  label="New password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword.value}
                  onInput$={(e) => (newPassword.value = (e.target as HTMLInputElement).value)}
                  hint="Min 8 characters, uppercase, number, and special character"
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword.value}
                  onInput$={(e) => (confirmPassword.value = (e.target as HTMLInputElement).value)}
                />
                <Button
                  onClick$={handleChangePassword}
                  loading={pwLoading.value}
                  disabled={!newPassword.value || !confirmPassword.value}
                >
                  Send reset code
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div class="rounded-xl border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-slate-900">
          <h2 class="text-base font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign out of your account on this device.
          </p>
          <div class="mt-4">
            <Button
              variant="danger"
              size="sm"
              onClick$={() => {
                localStorage.clear();
                ['accessToken', 'refreshToken', 'user'].forEach(k => {
                  document.cookie = `${k}=; Max-Age=0; path=/`;
                });
                window.location.href = '/auth/login';
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
});

export const head: DocumentHead = {
  title: 'Profile — AI Student Support',
};
