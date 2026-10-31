"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import {
  BellIcon,
  CalendarIcon,
  ChevronRightIcon,
  CloseIcon,
  FileTextIcon,
  KeyIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  MessageSquareIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  StethoscopeIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { clearTokens, getAccessToken, getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: LayoutDashboardIcon,
      },
    ],
  },
  {
    label: "Care operations",
    items: [
      { href: "/admin/patients", label: "Patients", icon: UsersIcon },
      { href: "/admin/doctors", label: "Doctors", icon: StethoscopeIcon },
      {
        href: "/admin/appointments",
        label: "Appointments",
        icon: CalendarIcon,
      },
      { href: "/admin/queries", label: "Queries", icon: MessageSquareIcon },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/access", label: "Access control", icon: KeyIcon },
      { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/patients": "Patients",
  "/admin/doctors": "Doctors",
  "/admin/appointments": "Appointments",
  "/admin/queries": "Queries",
  "/admin/access": "Access control",
  "/admin/settings": "Settings",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function AdminShellSkeleton() {
  return (
    <div className="min-h-screen bg-[#f6faf8] lg:flex">
      <div className="hidden w-72 bg-brand-deep lg:block" />
      <div className="flex-1 p-6 lg:p-8">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-slate-200/60"
            />
          ))}
        </div>
        <div className="mt-4 h-80 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const storedUser = getUser();

    if (!token || storedUser?.role.name !== "admin") {
      clearTokens();
      router.replace("/login");
      return;
    }

    setUser(storedUser);
    setIsChecking(false);
  }, [router]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  function handleSignOut() {
    clearTokens();
    router.replace("/login");
    router.refresh();
  }

  if (isChecking || !user) {
    return <AdminShellSkeleton />;
  }

  const pageTitle = pageTitles[pathname] ?? "Admin";
  const userInitials = initials(user.name);

  return (
    <div className="min-h-screen bg-[#f6faf8] lg:flex">
      {isMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-deep transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          isMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/admin/dashboard"
            className="rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          >
            <Logo tone="light" />
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-100/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-300/10 text-emerald-200 ring-1 ring-emerald-200/15">
            <ShieldCheckIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-100/45">
              Signed in as
            </p>
            <p className="text-xs font-semibold text-white">Administrator</p>
          </div>
        </div>

        <nav className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100/35">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-white/10 text-white ring-1 ring-white/10 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)]"
                          : "text-emerald-50/55 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                          isActive
                            ? "bg-emerald-300/15 text-emerald-200"
                            : "text-emerald-100/35 group-hover:text-emerald-100/70",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {isActive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
                      ) : (
                        <ChevronRightIcon className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-40" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-200 to-teal-400 text-xs font-semibold text-brand-deep">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {user.name}
              </p>
              <p className="truncate text-[10px] text-emerald-50/45">
                {user.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-emerald-50/65 transition hover:bg-white/5 hover:text-white"
          >
            <LogOutIcon className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-[#f6faf8]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:text-ink lg:hidden"
            >
              <MenuIcon className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Admin portal
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {pageTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 md:flex">
              <SearchIcon className="h-4 w-4 text-slate-400" />
              <span className="text-xs text-slate-400">
                Search patients, doctors...
              </span>
              <kbd className="ml-auto rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-400">
                ⌘K
              </kbd>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:text-ink"
            >
              <BellIcon className="h-4 w-4" />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-coral ring-2 ring-white" />
            </button>
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white py-1.5 pl-1.5 pr-3 sm:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-[10px] font-semibold text-white">
                {userInitials}
              </div>
              <div className="max-w-[120px] leading-tight">
                <p className="truncate text-[11px] font-semibold text-ink">
                  {user.name}
                </p>
                <p className="text-[10px] text-slate-400">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
