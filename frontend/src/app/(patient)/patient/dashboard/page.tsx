import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/layout/page-heading";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Patient dashboard",
};

const stats = [
  {
    label: "Upcoming appointments",
    value: "0",
    hint: "No visits scheduled",
  },
  {
    label: "Open questions",
    value: "0",
    hint: "Ask your care team anything",
  },
  {
    label: "Care team",
    value: "0",
    hint: "Your doctors will appear here",
  },
];

export default function PatientDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Patient dashboard"
        title="Welcome back"
        description="Track your recovery, book follow-ups, and stay connected with your cardiology care team."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            Book a follow-up
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose a cardiologist and pick a time that works for you. Your
            upcoming visits will show up in one place.
          </p>
          <Link
            href="/patient/appointments"
            className={buttonClasses("primary", "md", "mt-5")}
          >
            View appointments
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            Ask a question
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Share medication questions, symptoms, or recovery concerns with
            your care team and follow the response here.
          </p>
          <Link
            href="/patient/queries"
            className={buttonClasses("outline", "md", "mt-5")}
          >
            View my queries
          </Link>
        </Card>
      </div>
    </div>
  );
}
