"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  HeartPulseIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  StethoscopeIcon,
} from "@/components/ui/icons";
import { clearTokens } from "@/lib/auth";
import { loginWithRole } from "@/lib/auth-service";
import { getRoleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types";

const roleOptions = [
  {
    value: "admin" as const,
    label: "Admin",
    icon: ShieldCheckIcon,
  },
  {
    value: "doctor" as const,
    label: "Doctor",
    icon: StethoscopeIcon,
  },
  {
    value: "patient" as const,
    label: "Patient",
    icon: HeartPulseIcon,
  },
];

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signedInUser, setSignedInUser] = useState<User | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await loginWithRole({ email, password, role });

      if (user.role.name === "admin") {
        router.replace("/admin/dashboard");
        router.refresh();
        return;
      }

      setSignedInUser(user);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRoleChange(nextRole: UserRole) {
    setRole(nextRole);
    setError(null);
  }

  function handleSignOut() {
    clearTokens();
    setSignedInUser(null);
    setEmail("");
    setPassword("");
    setError(null);
  }

  if (signedInUser) {
    return (
      <div className="animate-fade-up w-full text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckIcon className="h-6 w-6" />
        </div>

        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-brand">
          Signed in
        </p>
        <h2 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.03em] text-ink">
          Welcome, {signedInUser.name.split(" ")[0]}.
        </h2>
        <p className="mx-auto mt-2 max-w-[300px] text-sm leading-6 text-slate-500">
          Your {getRoleLabel(signedInUser.role.name).toLowerCase()} session is
          active. Portal pages are coming next.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-left">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-slate-500">Role</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand/15">
              {getRoleLabel(signedInUser.role.name)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200/70 pt-3">
            <span className="text-[13px] text-slate-500">Email</span>
            <span className="truncate text-[13px] font-medium text-ink">
              {signedInUser.email}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={() => setSignedInUser(null)}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white transition hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Back to sign in
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up w-full">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-brand">
        Secure sign in
      </p>
      <h1 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-ink sm:text-[1.75rem]">
        Welcome back.
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Choose your portal and sign in with the credentials provided by your
        administrator.
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <fieldset>
          <legend className="text-[13px] font-medium text-slate-700">
            Sign in as
          </legend>

          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-100/80 p-1">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = role === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleRoleChange(option.value)}
                  className={cn(
                    "flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
                    isSelected
                      ? "bg-white text-brand-deep shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-700",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isSelected ? "text-brand" : "text-slate-400",
                    )}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[13px] font-medium text-slate-700"
            >
              Email address
            </label>
            <div className="relative mt-1.5">
              <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@clinic.com"
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[13px] font-medium text-slate-700"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-11 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 flex gap-2.5 rounded-xl border border-rose-200/80 bg-rose-50/90 p-3 text-rose-700"
          >
            <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Sign-in failed</p>
              <p className="mt-0.5 text-[11px] leading-5 text-rose-600">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative mt-4 inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand via-teal-600 to-emerald-500 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(15,118,110,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-18px_rgba(15,118,110,0.95)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-70"
        >
          <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.22)_40%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {isSubmitting ? (
            <>
              <SpinnerIcon className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
        Accounts are created by your administrator. Need access? Contact your
        clinic.
      </p>
    </div>
  );
}
