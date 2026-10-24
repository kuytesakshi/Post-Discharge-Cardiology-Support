import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in to view your appointments and care questions.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
