import type { Metadata } from "next";
import Link from "next/link";

import { PageHeading } from "@/components/layout/page-heading";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Doctor dashboard",
};

const stats = [
  {
    label: "Today's appointments",
    value: "0",
    hint: "No visits scheduled",
  },
  {
    label: "Open questions",
    value: "0",
    hint: "Patient questions awaiting a reply",
  },
  {
    label: "Patients under care",
    value: "0",
    hint: "Discharged patients will appear here",
  },
];

export default function DoctorDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Doctor dashboard"
        title="Welcome back"
        description="Review patient questions, manage your schedule, and keep post-discharge follow-ups on track."
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
            Review patient questions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            See questions from patients after discharge and reply with guidance
            or a follow-up recommendation.
          </p>
          <Link
            href="/doctor/queries"
            className={buttonClasses("primary", "md", "mt-5")}
          >
            View patient queries
          </Link>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            Manage your schedule
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Keep track of confirmed follow-up visits and update appointment
            status as patients move through recovery.
          </p>
          <Link
            href="/doctor/appointments"
            className={buttonClasses("outline", "md", "mt-5")}
          >
            View appointments
          </Link>
        </Card>
      </div>
    </div>
  );
}
