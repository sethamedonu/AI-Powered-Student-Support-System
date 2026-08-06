"use client";

import { useEffect, useState } from "react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const [particles, setParticles] = useState<
    Array<{ id: number; size: number; top: number; left: number; duration: number; delay: number }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        size: Math.random() * 3 + 1,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 5,
      })),
    );
  }, []);

  return (
    <div className="relative flex min-h-dvh font-sans overflow-hidden">
      {/* Animated background gradient for the entire page (subtle on the form side) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950" />

      {/* Left branding panel */}
      <div className="relative hidden w-[500px] shrink-0 overflow-hidden lg:flex lg:flex-col justify-between p-12 text-white">
        {/* Primary gradient background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(at 15% 25%, theme('colors.indigo.400') 0px, transparent 50%),
              radial-gradient(at 85% 15%, theme('colors.purple.400') 0px, transparent 45%),
              radial-gradient(at 65% 80%, theme('colors.indigo.500') 0px, transparent 55%),
              radial-gradient(at 5% 90%, theme('colors.slate.700') 0px, transparent 40%),
              linear-gradient(165deg, rgba(30, 27, 75, 0.9) 0%, rgba(63, 58, 174, 0.9) 100%)
            `,
          }}
        />

        {/* Subtle animated particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                top: `${p.top}%`,
                left: `${p.left}%`,
                animation: `float ${p.duration}s linear infinite`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, theme('colors.white') 1px, transparent 1px)," +
              "linear-gradient(to bottom, theme('colors.white') 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Logo & Brand */}
        <div className="relative z-10 flex items-center gap-4 group">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-400/20 to-purple-400/20 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-white/20">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-400/30 to-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="relative h-7 w-7 text-white"
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
          <span className="font-display text-xl font-bold tracking-tight text-white">
            AI Student Support
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-10">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              Powered by Amazon Bedrock
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              <span className="block">Your academic</span>
              <span className="block">questions,</span>
              <span className="block bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                answered instantly.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-indigo-200">
              Get accurate answers about admissions, courses, tuition, exams,
              and more — available 24/7.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              { text: "Admissions & enrollment guidance", icon: "graduation" },
              { text: "Course registration support", icon: "registration" },
              { text: "Tuition & scholarship information", icon: "money" },
              { text: "Exam schedules & academic calendar", icon: "calendar" },
            ].map((item) => (
              <li
                key={item.text}
                className="group flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-300 hover:translate-x-1 hover:bg-white/5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-400/20 ring-1 ring-indigo-400/30 transition-all duration-300 group-hover:bg-indigo-400/30 group-hover:ring-indigo-400/50">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 text-indigo-200"
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
                <span className="text-sm text-indigo-50 transition-colors duration-300 group-hover:text-indigo-100">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur-[12px]">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity duration-500" />
            <div className="relative">
              <p className="text-sm leading-relaxed text-indigo-100/90">
                &ldquo;Got my registration question answered in seconds. This is
                exactly what students needed.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/30 text-xs font-bold text-white ring-1 ring-indigo-300/30">
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
        </div>

        <p className="relative z-10 text-xs text-indigo-300/70">
          © {new Date().getFullYear()} AI-Powered Student Support System
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 dark:bg-slate-950 lg:px-16">
        {/* Subtle pattern behind form */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage:
            "linear-gradient(to right, theme('colors.slate.300') 1px, transparent 1px)," +
            "linear-gradient(to bottom, theme('colors.slate.300') 1px, transparent 1px)",
          backgroundSize: "24px 24px, 24px 24px",
        }} />

        {/* Mobile logo */}
        <div className="relative mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
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
          <span className="font-display text-xl font-bold text-slate-800 dark:text-white">
            AI Student Support
          </span>
        </div>

        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/60 p-8 shadow-xl shadow-black/5 animate-fade-in dark:bg-slate-900/60 dark:shadow-black/20">
          {children}
        </div>
      </div>
    </div>
  );
}
