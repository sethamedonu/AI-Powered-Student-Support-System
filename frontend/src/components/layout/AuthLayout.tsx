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
    <div className="fixed inset-0 flex font-sans overflow-hidden">
      {/* Animated background gradient for the entire page (subtle on the form side) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950" />

      {/* Left branding panel */}
      <div className="relative hidden w-[540px] shrink-0 overflow-hidden lg:flex lg:flex-col justify-between p-12 text-white">
        {/* Primary gradient background - more vibrant */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(at 20% 30%, rgba(99, 102, 241, 0.4) 0px, transparent 50%),
              radial-gradient(at 80% 20%, rgba(168, 85, 247, 0.4) 0px, transparent 50%),
              radial-gradient(at 60% 80%, rgba(79, 70, 229, 0.3) 0px, transparent 55%),
              radial-gradient(at 10% 90%, rgba(59, 130, 246, 0.3) 0px, transparent 45%),
              linear-gradient(135deg, #667eea 0%, #764ba2 100%)
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

        {/* Hero copy - enhanced */}
        <div className="relative z-10 space-y-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200 backdrop-blur-sm">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Powered by Amazon Bedrock
            </p>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
              <span className="block">Your academic</span>
              <span className="block">journey,</span>
              <span className="block bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                simplified.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-indigo-100">
              Get instant, accurate answers about admissions, courses, tuition, exams,
              and campus life — available 24/7 with AI-powered intelligence.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              { text: "Instant admission & enrollment guidance", icon: "M12 14l9-5-9-5-9 5 9 5z" },
              { text: "Course registration made simple", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { text: "Clear tuition & scholarship info", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { text: "Exam schedules & important dates", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            ].map((item) => (
              <li
                key={item.text}
                className="group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 hover:translate-x-1 hover:bg-white/10"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 transition-all duration-300 group-hover:bg-white/20 group-hover:ring-white/30 group-hover:shadow-lg group-hover:shadow-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-indigo-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-indigo-50 transition-colors duration-300 group-hover:text-white">
                  {item.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-7 shadow-2xl shadow-black/20 backdrop-blur-md">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-base leading-relaxed text-white/95">
                &ldquo;This AI saved me hours of searching through handbooks! Got my registration question answered at 2 AM when no one else was available.&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
                  SM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Sarah M.</p>
                  <p className="text-xs text-indigo-200">
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
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto bg-white px-6 py-12 dark:bg-slate-950 lg:px-16">
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

        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
