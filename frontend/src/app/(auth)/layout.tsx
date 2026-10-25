import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4faf7] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(45,212,191,0.16),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(251,113,133,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-teal-100/50 blur-3xl" />

      <div className="relative grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_32px_100px_-48px_rgba(4,47,46,0.55)] backdrop-blur-xl lg:min-h-[600px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-deep p-9 lg:flex xl:p-11">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(45,212,191,0.22),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(251,113,133,0.18),transparent_34%)]" />
          <div className="bg-grid absolute inset-0 opacity-50" />
          <div className="animate-glow-pulse absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="animate-float-slow absolute -right-16 bottom-6 h-64 w-64 rounded-full bg-coral/10 blur-3xl" />

          <div className="relative">
            <Link
              href="/login"
              className="inline-flex rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <Logo tone="light" />
            </Link>

            <div className="mt-10 max-w-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-100/80 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                Post-discharge cardiology
              </span>

              <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white xl:text-[2.75rem]">
                Care that keeps
                <span className="block bg-gradient-to-r from-emerald-200 via-teal-100 to-white bg-clip-text text-transparent">
                  a steady rhythm.
                </span>
              </h1>

              <p className="mt-4 max-w-xs text-sm leading-6 text-emerald-50/65">
                A calm home for the days after discharge — where care teams
                coordinate and the next step is always clear.
              </p>
            </div>
          </div>

          <div className="relative mt-8">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.24em] text-emerald-100/50">
                <span>Care signal</span>
                <span className="flex items-center gap-1.5 text-emerald-200/80">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  Stable
                </span>
              </div>
              <svg
                viewBox="0 0 640 120"
                className="mt-2 h-16 w-full text-emerald-300"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M0 64h118l18-36 22 72 20-54 16 18h108l18-32 20 58 18-40 16 14h146l18-24 20 48 18-32 14 8h120"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-ecg"
                />
                <path
                  d="M0 64h118l18-36 22 72 20-54 16 18h108l18-32 20 58 18-40 16 14h146l18-24 20 48 18-32 14 8h120"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.08"
                />
              </svg>
              <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-emerald-50/55">
                <span>Discharge</span>
                <span>First check-in</span>
                <span>Recovery</span>
              </div>
            </div>

            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-emerald-50/55">
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-300" />
                Admin-controlled
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-300" />
                Role-based access
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-emerald-300" />
                Care connected
              </li>
            </ul>
          </div>
        </aside>

        <main className="relative flex min-w-0 items-center justify-center p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="w-full min-w-0 max-w-[400px]">
            <Link
              href="/login"
              className="mb-7 flex justify-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
            >
              <Logo />
            </Link>

            {children}

            <p className="mx-auto mt-7 max-w-[340px] text-center text-[11px] leading-5 text-slate-400">
              CardioCare supports non-urgent follow-up care. In an emergency,
              contact your local emergency services.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
