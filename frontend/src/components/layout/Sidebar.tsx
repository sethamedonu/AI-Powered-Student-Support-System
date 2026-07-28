import { component$, useSignal } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { Avatar } from '~/components/ui/Avatar';
import { DarkModeToggle } from '~/components/ui/DarkModeToggle';
import type { User } from '~/lib/types';
import { getInitials, getFullName } from '~/lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/chat', label: 'AI Chat', icon: 'chat' },
  { href: '/conversations', label: 'History', icon: 'history' },
  { href: '/profile', label: 'Profile', icon: 'user' },
  { href: '/feedback', label: 'Feedback', icon: 'feedback' },
  { href: '/admin', label: 'Admin', icon: 'admin', adminOnly: true },
];

const icons: Record<string, string> = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  history: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  feedback: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  admin: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
};

interface SidebarProps {
  user: User | null;
  isDark: boolean;
}

export const Sidebar = component$<SidebarProps>(({ user, isDark }) => {
  const loc = useLocation();
  const isOpen = useSignal(false);

  const isActive = (href: string) =>
    href === '/dashboard'
      ? loc.url.pathname === '/dashboard' || loc.url.pathname === '/dashboard/'
      : loc.url.pathname.startsWith(href);

  const navLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      onClick$={() => (isOpen.value = false)}
      class={[
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
        isActive(item.href)
          ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200',
      ].join(' ')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d={icons[item.icon]} />
      </svg>
      {item.label}
    </Link>
  );

  const sidebarContent = (
    <div class="flex h-full flex-col">
      {/* Logo */}
      <div class="flex items-center gap-3 px-5 py-6">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 shadow-sm shadow-primary-600/40">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.477 10-10 10S1 18.523 1 13c0-.85.1-1.678.29-2.472L12 14z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Student</p>
          <p class="text-xs text-slate-400 dark:text-slate-500">Support System</p>
        </div>
      </div>

      {/* Nav */}
      <nav class="flex-1 space-y-0.5 px-3">
        <p class="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          Navigation
        </p>
        {NAV_ITEMS.filter(i => !i.adminOnly || user?.role === 'admin').map(navLink)}
      </nav>

      {/* Bottom */}
      <div class="border-t border-slate-100 p-3 dark:border-white/5">
        <div class="flex items-center justify-between gap-2">
          {user && (
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <Avatar initials={getInitials(user)} size="sm" />
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{getFullName(user)}</p>
                <p class="truncate text-xs capitalize text-slate-400">{user.role}</p>
              </div>
            </div>
          )}
          <div class="flex shrink-0 items-center gap-1">
            <DarkModeToggle isDark={isDark} />
            <Link
              href="/auth/login"
              onClick$={() => {
                localStorage.clear();
                document.cookie = 'accessToken=; Max-Age=0; path=/';
                document.cookie = 'refreshToken=; Max-Age=0; path=/';
                document.cookie = 'user=; Max-Age=0; path=/';
              }}
              class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
              aria-label="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header class="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3 dark:border-white/5 dark:bg-slate-900 lg:hidden">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Student Support</span>
        </div>
        <button
          type="button"
          onClick$={() => (isOpen.value = !isOpen.value)}
          class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Toggle menu"
        >
          {isOpen.value ? (
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {isOpen.value && (
        <div class="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden" onClick$={() => (isOpen.value = false)} />
      )}

      {/* Mobile drawer */}
      <aside
        class={[
          'fixed inset-y-0 left-0 z-30 w-64 bg-white transition-transform dark:bg-slate-900 lg:hidden',
          isOpen.value ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside class="hidden w-64 shrink-0 border-r border-slate-100 bg-white dark:border-white/5 dark:bg-slate-900 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>
    </>
  );
});
