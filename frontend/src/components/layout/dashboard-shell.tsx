"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { clearTokens } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export type NavItem = {
  href: string;
  label: string;
};

type DashboardShellProps = {
  role: UserRole;
  navItems: NavItem[];
  children: ReactNode;
};

export function DashboardShell({
  role,
  navItems,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const roleLabel = role === "doctor" ? "Doctor" : "Patient";

  function handleSignOut() {
    clearTokens();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center justify-between px-6 lg:h-auto lg:py-6">
          <Link href="/" className="rounded-lg focus-visible:outline-2">
            <Logo />
          </Link>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            {roleLabel}
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-slate-500">
            {roleLabel} portal
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
