import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Join as a patient or a cardiology doctor.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
