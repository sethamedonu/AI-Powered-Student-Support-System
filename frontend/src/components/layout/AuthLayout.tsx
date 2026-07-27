import { component$, Slot } from '@builder.io/qwik';

export const AuthLayout = component$(() => {
  return (
    <div class="flex min-h-dvh">
      {/* Left branding panel — hidden on mobile */}
      <div class="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary-700 p-12 text-white">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.477 10-10 10S1 18.523 1 13c0-.85.1-1.678.29-2.472L12 14z" />
            </svg>
          </div>
          <span class="text-lg font-semibold">AI Student Support</span>
        </div>

        <div>
          <h1 class="text-4xl font-bold leading-tight">
            Your academic questions,<br />answered instantly.
          </h1>
          <p class="mt-4 text-lg text-primary-200">
            Get instant, accurate answers about admissions, courses, tuition, exams, and more — powered by AI.
          </p>

          <div class="mt-10 space-y-4">
            {[
              'Admissions & enrollment guidance',
              'Course registration support',
              'Tuition & scholarship information',
              'Exam schedules & academic calendar',
            ].map((item) => (
              <div key={item} class="flex items-center gap-3">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-primary-100">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p class="text-sm text-primary-300">© {new Date().getFullYear()} AI-Powered Student Support System</p>
      </div>

      {/* Right form panel */}
      <div class="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div class="mb-8 flex items-center gap-2 lg:hidden">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <span class="text-base font-semibold text-slate-800 dark:text-slate-100">AI Student Support</span>
        </div>

        <div class="w-full max-w-md">
          <Slot />
        </div>
      </div>
    </div>
  );
});
