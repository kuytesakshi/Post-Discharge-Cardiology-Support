import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="rounded-lg focus-visible:outline-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className={buttonClasses("ghost", "sm")}>
            Sign in
          </Link>
          <Link href="/register" className={buttonClasses("primary", "sm")}>
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
