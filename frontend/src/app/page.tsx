import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const personas = [
  {
    title: "For patients",
    description:
      "Ask recovery questions, keep track of medications, and book follow-up visits with your cardiology care team.",
    points: [
      "Ask non-urgent care questions",
      "Book and manage appointments",
      "Keep your discharge details together",
    ],
    action: "Continue as a patient",
  },
  {
    title: "For doctors",
    description:
      "Review patient questions, manage your schedule, and keep post-discharge follow-ups on track.",
    points: [
      "Respond to patient questions",
      "Manage upcoming appointments",
      "View patient discharge context",
    ],
    action: "Continue as a doctor",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="max-w-3xl">
            <Badge tone="teal">Post-discharge cardiology support</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Recovery support, right when you need it.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              CardioCare connects patients and cardiology teams after hospital
              discharge, so questions get answered and follow-up care stays on
              schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={buttonClasses("primary", "md")}>
                Create an account
              </Link>
              <Link href="/login" className={buttonClasses("outline", "md")}>
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {personas.map((persona) => (
              <Card key={persona.title} className="flex flex-col">
                <h2 className="text-xl font-semibold text-slate-900">
                  {persona.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {persona.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {persona.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={buttonClasses(
                    "ghost",
                    "sm",
                    "mt-6 self-start px-0 text-teal-700 hover:bg-transparent hover:text-teal-800",
                  )}
                >
                  {persona.action} &rarr;
                </Link>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-900">
            <strong className="font-semibold">Medical emergency?</strong> Call
            your local emergency number immediately. CardioCare is for
            non-urgent follow-up support and is not a replacement for emergency
            care.
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>CardioCare post-discharge cardiology support</p>
          <p>Built for patients and cardiology teams</p>
        </div>
      </footer>
    </div>
  );
}
