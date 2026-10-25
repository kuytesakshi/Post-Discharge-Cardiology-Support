import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the CardioCare portal as an administrator, doctor, or patient.",
};

export default function LoginPage() {
  return <LoginForm />;
}
