import { component$, Slot } from '@builder.io/qwik';

export const AuthLayout = component$(() => {
  return (
    <div class="flex min-h-dvh">
      {/* ── Left branding panel ── */}
      <div class="mesh-bg hidden lg:flex lg:w-[52%] flex-col justify-between p-14 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div class="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div class="pointer-events-none absolute bottom-32 -left-16 h-64 w-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div class="flex items-center gap-3 relative z-10">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.477 10-10 10S1 18.523 1 13c0-.85.1-1.678.29-2.472L12 14z" />
            </svg>
          </div>
          <span class="text-base font-semibold tracking-wide">AI Student Support</span>
        </div>

        {/* Hero copy */}
        <div class="relative z-10 space-y-6">
          <div>
            <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-300">Powered by Amazon Bedrock</p>
            <h1 class="font-display text-5xl font-bold leading-[1.15] text-white">
              Your academic<br />questions,<br />
              <span class="text-indigo-300">answered instantly.</span>
            </h1>
            <p class="mt-5 text-lg leading-relaxed text-indigo-200/80">
              Get accurate answers about admissions, courses, tuition, exams, and more — available 24/7.
            </p>
          </div>

          {/* Feature list */}
          <ul class="space-y-3">
            {[
              'Admissions & enrollment guidance',
              'Course registration support',
              'Tuition & scholarship information',
              'Exam schedules & academic calendar',
            ].map((item) => (
              <li key={item} class="flex items-center gap-3">
                <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-400/30 ring-1 ring-indigo-400/40">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-indigo-200" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-sm text-indigo-100">{item}</span>
              </li>
            ))}
          </ul>

          {/* Testimonial card */}
          <div class="glass rounded-2xl p-5">
            <p class="text-sm leading-relaxed text-white/90">
              "Got my registration question answered in seconds. This is exactly what students needed."
            </p>
            <div class="mt-3 flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/40 text-xs font-bold text-white">
                SM
              </div>
              <div>
                <p class="text-xs font-semibold text-white">Sarah M.</p>
                <p class="text-xs text-indigo-300">3rd Year, Computer Science</p>
              </div>
            </div>
          </div>
        </div>

        <p class="relative z-10 text-xs text-indigo-400">
          © {new Date().getFullYear()} AI-Powered Student Support System
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div class="flex flex-1 flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Student Support</span>
        </div>

        <div class="w-full max-w-md">
          <Slot />
        </div>
      </div>
    </div>
  );
});
