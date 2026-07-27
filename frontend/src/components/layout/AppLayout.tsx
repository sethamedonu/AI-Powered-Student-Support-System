import { component$, Slot, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { Sidebar } from './Sidebar';
import type { User } from '~/lib/types';

export const AppLayout = component$(() => {
  const user = useSignal<User | null>(null);
  const isDark = useSignal(false);

  useVisibleTask$(() => {
    // Load user from cookie/localStorage
    try {
      const raw = document.cookie
        .split('; ')
        .find(r => r.startsWith('user='))
        ?.split('=')
        .slice(1)
        .join('=');
      if (raw) user.value = JSON.parse(decodeURIComponent(raw)) as User;
    } catch {
      // fallback to localStorage
      const stored = localStorage.getItem('user');
      if (stored) {
        try { user.value = JSON.parse(stored) as User; } catch { /* ignore */ }
      }
    }

    isDark.value = document.documentElement.classList.contains('dark');

    // Keep isDark in sync when toggled
    const observer = new MutationObserver(() => {
      isDark.value = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  });

  return (
    <div class="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar user={user.value} isDark={isDark.value} />
      <div class="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar spacer handled inside Sidebar */}
        <main class="flex-1 overflow-y-auto">
          <Slot />
        </main>
      </div>
    </div>
  );
});
