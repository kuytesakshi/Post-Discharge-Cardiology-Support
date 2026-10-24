import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 via-slate-50 to-white px-6 py-12">
      <Link href="/" className="mb-8 rounded-lg focus-visible:outline-2">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {children}
      </div>
      <p className="mt-6 max-w-md text-center text-xs leading-5 text-slate-500">
        CardioCare supports non-urgent follow-up care. In an emergency, contact
        your local emergency services.
      </p>
    </div>
  );
}
