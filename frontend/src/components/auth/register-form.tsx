"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { setTokens } from "@/lib/auth";
import type { TokenPair, User, UserRole } from "@/types";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });
      const tokens = await apiFetch<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setTokens(tokens);
      router.push(role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700"
        >
          Full name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Dr. Jane Doe"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="role"
          className="block text-sm font-medium text-slate-700"
        >
          I am a
        </label>
        <Select
          id="role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </Select>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-teal-700 hover:text-teal-800"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
