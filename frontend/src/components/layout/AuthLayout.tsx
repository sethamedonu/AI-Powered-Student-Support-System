export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      {/* Left branding panel */}
      <div className="mesh-bg hidden lg:flex lg:w-[52%] flex-col justify-between p-14 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-32 -left-16 h-64 w-64 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 5.523-4.477 10-10 10S1 18.523 1 13c0-.85.1-1.678.29-2.472L12 14z"
              />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-wide">
            AI Student Support
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-300">
              Powered by Amazon Bedrock
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.15] text-white">
              Your academic
              <br />
              questions,
              <br />
              <span className="text-indigo-300">answered instantly.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-indigo-200/80">
              Get accurate answers about admissions, courses, tuition, exams,
              and more — available 24/7.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              "Admissions & enrollment guidance",
              "Course registration support",
              "Tuition & scholarship information",
              "Exam schedules & academic calendar",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-400/30 ring-1 ring-indigo-400/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-indigo-200"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm text-indigo-100">{item}</span>
              </li>
            ))}
          </ul>

          <div className="glass rounded-2xl p-5">
            <p className="text-sm leading-relaxed text-white/90">
              &ldquo;Got my registration question answered in seconds. This is
              exactly what students needed.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/40 text-xs font-bold text-white">
                SM
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Sarah M.</p>
                <p className="text-xs text-indigo-300">
                  3rd Year, Computer Science
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-indigo-400">
          © {new Date().getFullYear()} AI-Powered Student Support System
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white dark:bg-slate-950 px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 14l9-5-9-5-9 5 9 5z"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            AI Student Support
          </span>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
