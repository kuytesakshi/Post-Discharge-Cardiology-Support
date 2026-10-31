"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  HeartPulseIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  StethoscopeIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { getAdminDashboard } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  AdminActivity,
  AdminAlert,
  AdminAppointment,
  AdminDashboardData,
  AdminDoctor,
  AdminMetric,
  AdminPatient,
  FollowUpPoint,
  MetricTone,
  PatientStatus,
  RiskLevel,
  RiskSlice,
} from "@/types/admin";

const metricToneClasses: Record<
  MetricTone,
  { icon: string; spark: string; pill: string }
> = {
  teal: {
    icon: "bg-teal-50 text-teal-700 ring-teal-600/10",
    spark: "text-teal-600",
    pill: "bg-teal-50 text-teal-700 ring-teal-600/15",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    spark: "text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  },
  coral: {
    icon: "bg-rose-50 text-rose-600 ring-rose-600/10",
    spark: "text-rose-500",
    pill: "bg-rose-50 text-rose-700 ring-rose-600/15",
  },
  amber: {
    icon: "bg-amber-50 text-amber-700 ring-amber-600/10",
    spark: "text-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-600/15",
  },
};

const metricIcons = [UsersIcon, StethoscopeIcon, CalendarIcon, HeartPulseIcon];

const riskTone: Record<RiskLevel, "green" | "amber" | "red"> = {
  low: "green",
  moderate: "amber",
  high: "red",
};

const riskLabel: Record<RiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate",
  high: "High risk",
};

const statusTone: Record<PatientStatus, "green" | "amber" | "red"> = {
  on_track: "green",
  needs_attention: "amber",
  overdue: "red",
};

const statusLabel: Record<PatientStatus, string> = {
  on_track: "On track",
  needs_attention: "Needs attention",
  overdue: "Overdue",
};

const appointmentTone: Record<
  AdminAppointment["status"],
  "green" | "amber" | "slate" | "red"
> = {
  confirmed: "green",
  pending: "amber",
  completed: "slate",
  cancelled: "red",
  no_show: "red",
};

const appointmentLabel: Record<AdminAppointment["status"], string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const availabilityTone: Record<
  AdminDoctor["availability"],
  "green" | "amber" | "slate"
> = {
  available: "green",
  in_consult: "amber",
  off_duty: "slate",
};

const availabilityLabel: Record<AdminDoctor["availability"], string> = {
  available: "Available",
  in_consult: "In consult",
  off_duty: "Off duty",
};

const activityToneClasses: Record<
  AdminAlert["severity"] | "emerald" | "teal" | "coral" | "amber",
  string
> = {
  high: "bg-rose-500",
  medium: "bg-amber-500",
  low: "bg-teal-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  coral: "bg-rose-400",
  amber: "bg-amber-400",
};

function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 34 - ((value - min) / Math.max(max - min, 1)) * 28;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
      className={cn("h-10 w-full", className)}
      aria-hidden="true"
    >
      <polygon
        points={`0,40 ${points} 100,40`}
        fill="currentColor"
        opacity="0.08"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({ metric, index }: { metric: AdminMetric; index: number }) {
  const tone = metricToneClasses[metric.tone];
  const Icon = metricIcons[index % metricIcons.length];
  const TrendIcon =
    metric.trend === "up"
      ? TrendingUpIcon
      : metric.trend === "down"
        ? TrendingDownIcon
        : MoreHorizontalIcon;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_24px_60px_-36px_rgba(4,47,46,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {metric.label}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">
            {metric.value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset",
            tone.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
              tone.pill,
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {metric.trendLabel}
          </span>
          <p className="mt-1.5 text-[11px] text-slate-400">{metric.helper}</p>
        </div>
        <Sparkline
          values={metric.sparkline}
          className={cn("max-w-[92px]", tone.spark)}
        />
      </div>
    </Card>
  );
}

function DashboardHero({ data }: { data: AdminDashboardData }) {
  const followUps =
    data.metrics.find((metric) => metric.label === "Follow-ups today")?.value ??
    "0";
  const highRisk =
    data.metrics.find((metric) => metric.label === "High-risk patients")
      ?.value ?? "0";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-deep p-6 text-white shadow-[0_30px_80px_-48px_rgba(4,47,46,0.8)] sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(45,212,191,0.2),transparent_32%),radial-gradient(circle_at_88%_80%,rgba(251,113,133,0.14),transparent_30%)]" />
      <div className="bg-grid absolute inset-0 opacity-40" />
      <div className="absolute -right-12 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-100/60">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
              Care signal stable
            </span>
            <span>{data.displayDate}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Good morning, {data.adminName}.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/65">
            Here&apos;s the pulse of your post-discharge program today. You have{" "}
            {followUps} follow-ups, {highRisk} high-risk patients, and{" "}
            {data.alerts.length} items needing attention.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/patients"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-semibold text-brand-deep transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
          >
            <UserPlusIcon className="h-4 w-4" />
            Add patient
          </Link>
          <Link
            href="/admin/doctors"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
          >
            <StethoscopeIcon className="h-4 w-4" />
            Invite doctor
          </Link>
          <Link
            href="/admin/appointments"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200"
          >
            <CalendarIcon className="h-4 w-4" />
            Schedule
          </Link>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5 text-[11px] text-emerald-50/55">
        <span className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" />
          Updated {data.lastUpdated}
        </span>
        <span className="h-1 w-1 rounded-full bg-emerald-300/50" />
        <span>{followUps} follow-ups today</span>
        <span className="h-1 w-1 rounded-full bg-emerald-300/50" />
        <span>{highRisk} high-risk patients</span>
      </div>
    </section>
  );
}

function buildLinePath(
  series: FollowUpPoint[],
  key: "completed" | "scheduled",
  width: number,
  height: number,
  max: number,
  paddingX: number,
) {
  const plotWidth = width - paddingX * 2;
  return series
    .map((point, index) => {
      const x =
        paddingX + (index / Math.max(series.length - 1, 1)) * plotWidth;
      const y = height - (point[key] / max) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function FollowUpChart({ series }: { series: FollowUpPoint[] }) {
  const width = 560;
  const height = 160;
  const paddingX = 18;
  const peak = Math.max(
    ...series.flatMap((point) => [point.completed, point.scheduled]),
    1,
  );
  const max = Math.max(4, Math.ceil(peak / 2) * 2);
  const completedPath = buildLinePath(
    series,
    "completed",
    width,
    height,
    max,
    paddingX,
  );
  const scheduledPath = buildLinePath(
    series,
    "scheduled",
    width,
    height,
    max,
    paddingX,
  );
  const completedArea = `${completedPath} L${width - paddingX} ${height} L${paddingX} ${height} Z`;
  const totalCompleted = series.reduce(
    (total, point) => total + point.completed,
    0,
  );
  const totalScheduled = series.reduce(
    (total, point) => total + point.scheduled,
    0,
  );

  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Follow-up activity
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Completed vs. scheduled visits this week
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 ring-1 ring-inset ring-slate-200">
          Last 7 days
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" />
          Completed
          <span className="font-semibold text-ink">{totalCompleted}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-coral" />
          Scheduled
          <span className="font-semibold text-ink">{totalScheduled}</span>
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/80 to-white p-3">
        <svg
          viewBox={`0 0 ${width} 220`}
          className="h-auto w-full"
          role="img"
          aria-label="Follow-up activity chart"
        >
          <defs>
            <linearGradient id="completedArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <line
              key={fraction}
              x1="0"
              y1={height * fraction}
              x2={width}
              y2={height * fraction}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={fraction === 1 ? undefined : "4 6"}
            />
          ))}

          <path d={completedArea} fill="url(#completedArea)" />
          <path
            d={scheduledPath}
            fill="none"
            stroke="#fb7185"
            strokeWidth="2.2"
            strokeDasharray="6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={completedPath}
            fill="none"
            stroke="#0f766e"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {series.map((point, index) => {
            const x =
              paddingX +
              (index / Math.max(series.length - 1, 1)) *
                (width - paddingX * 2);
            const y = height - (point.completed / max) * height;
            return (
              <circle
                key={point.label}
                cx={x}
                cy={y}
                r="3.5"
                fill="#ffffff"
                stroke="#0f766e"
                strokeWidth="2"
              />
            );
          })}

          {series.map((point, index) => {
            const x =
              paddingX +
              (index / Math.max(series.length - 1, 1)) *
                (width - paddingX * 2);
            return (
              <text
                key={point.label}
                x={x}
                y="205"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}

function RiskMix({
  riskMix,
  totalPatients,
}: {
  riskMix: RiskSlice[];
  totalPatients: number;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = riskMix.map((slice, index) => {
    const length = (slice.value / 100) * circumference;
    const offset = riskMix
      .slice(0, index)
      .reduce(
        (total, previous) => total + (previous.value / 100) * circumference,
        0,
      );
    return { ...slice, length, offset };
  });

  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Risk mix
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Across the active recovery cohort
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/15">
          Stable
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="14"
            />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="14"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold tracking-[-0.04em] text-ink">
              {totalPatients}
            </p>
            <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
              Patients
            </p>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-3">
          {riskMix.map((slice) => (
            <li key={slice.label} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                {slice.label}
              </span>
              <span className="text-xs font-semibold text-ink">
                {slice.value}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-700">
        <TrendingDownIcon className="h-3.5 w-3.5" />
        Calculated from current readmission risk scores
      </div>
    </Card>
  );
}

function patientInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-xs text-slate-500">
      {message}
    </div>
  );
}

function RecentPatients({ patients }: { patients: AdminPatient[] }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Recent patients
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest additions and follow-up activity
          </p>
        </div>
        <Link
          href="/admin/patients"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-deep"
        >
          View all
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        {patients.length ? (
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                <th className="pb-2.5 pr-3 font-semibold">Patient</th>
                <th className="pb-2.5 pr-3 font-semibold">Risk</th>
                <th className="pb-2.5 pr-3 font-semibold">Care team</th>
                <th className="pb-2.5 pr-3 font-semibold">Next follow-up</th>
                <th className="pb-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <PatientRow key={patient.id} patient={patient} />
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyPanel message="No patients have been enrolled yet." />
        )}
      </div>
    </Card>
  );
}

function PatientRow({ patient }: { patient: AdminPatient }) {
  return (
    <tr className="group text-xs text-slate-600 transition-colors hover:bg-slate-50/70">
      <td className="py-3 pr-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-[10px] font-semibold text-brand">
            {patientInitials(patient.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{patient.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              {patient.age !== null ? `${patient.age} yrs · ` : ""}
              {patient.condition}
            </p>
          </div>
        </div>
      </td>
      <td className="py-3 pr-3">
        <Badge tone={riskTone[patient.risk]}>{riskLabel[patient.risk]}</Badge>
      </td>
      <td className="py-3 pr-3 text-[11px] text-slate-500">
        {patient.doctor}
      </td>
      <td className="py-3 pr-3 text-[11px] text-slate-500">
        {patient.nextFollowUp}
      </td>
      <td className="py-3">
        <Badge tone={statusTone[patient.status]}>
          {statusLabel[patient.status]}
        </Badge>
      </td>
    </tr>
  );
}

function TodaySchedule({
  appointments,
}: {
  appointments: AdminAppointment[];
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Today&apos;s schedule
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {appointments.length} visits across the care team
          </p>
        </div>
        <Link
          href="/admin/appointments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-deep"
        >
          Calendar
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 space-y-2.5">
        {appointments.length ? (
          appointments.map((appointment, index) => (
            <div
              key={appointment.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="w-11 shrink-0">
                <p className="text-xs font-semibold text-ink">
                  {appointment.time}
                </p>
                <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-slate-400">
                  {index === 0 ? "Next" : "Today"}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">
                  {appointment.patient}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {appointment.type} · {appointment.doctor}
                </p>
              </div>
              <Badge tone={appointmentTone[appointment.status]}>
                {appointmentLabel[appointment.status]}
              </Badge>
            </div>
          ))
        ) : (
          <EmptyPanel message="No visits are scheduled for today." />
        )}
      </div>
    </Card>
  );
}

function CareTeam({
  careTeam,
  totalDoctors,
}: {
  careTeam: AdminDoctor[];
  totalDoctors: number;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Care team
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {totalDoctors} doctors · {careTeam.length} shown
          </p>
        </div>
        <Link
          href="/admin/doctors"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition hover:text-brand-deep"
        >
          Manage
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-4 space-y-2.5">
        {careTeam.length ? (
          careTeam.map((doctor) => (
            <li
              key={doctor.id}
              className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5 transition hover:border-slate-200 hover:bg-slate-50/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-emerald-500 text-[10px] font-semibold text-white">
                {doctor.initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink">
                  {doctor.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {doctor.specialty} · {doctor.patients} patients
                </p>
              </div>
              <Badge tone={availabilityTone[doctor.availability]}>
                {availabilityLabel[doctor.availability]}
              </Badge>
            </li>
          ))
        ) : (
          <li>
            <EmptyPanel message="No doctors have been added yet." />
          </li>
        )}
      </ul>
    </Card>
  );
}

function AttentionNeeded({ alerts }: { alerts: AdminAlert[] }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Needs attention
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Items that need a decision today
          </p>
        </div>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-50 px-2 text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-600/15">
          {alerts.length}
        </span>
      </div>

      {alerts.length ? (
        <ul className="mt-4 space-y-2.5">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-xl border p-3",
                alert.severity === "high" && "border-rose-100 bg-rose-50/60",
                alert.severity === "medium" && "border-amber-100 bg-amber-50/60",
                alert.severity === "low" && "border-teal-100 bg-teal-50/60",
              )}
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangleIcon
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    alert.severity === "high"
                      ? "text-rose-500"
                      : alert.severity === "medium"
                        ? "text-amber-500"
                        : "text-teal-500",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">
                    {alert.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    {alert.description}
                  </p>
                  <Link
                    href={alert.href}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand transition hover:text-brand-deep"
                  >
                    {alert.actionLabel}
                    <ArrowUpRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-4 text-[11px] text-emerald-700">
          <CheckIcon className="h-4 w-4" />
          You&apos;re all caught up. No urgent items right now.
        </div>
      )}
    </Card>
  );
}

function ActivityFeed({ activity }: { activity: AdminActivity[] }) {
  return (
    <Card className="rounded-2xl border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_-38px_rgba(4,47,46,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest changes across the program
          </p>
        </div>
        <MessageSquareIcon className="h-4 w-4 text-slate-300" />
      </div>

      {activity.length ? (
        <ol className="mt-4 space-y-0">
          {activity.map((item, index) => (
            <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < activity.length - 1 ? (
                <span className="absolute left-[5px] top-3 h-full w-px bg-slate-100" />
              ) : null}
              <span
                className={cn(
                  "relative mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white",
                  activityToneClasses[item.tone],
                )}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                  {item.description}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{item.time}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4">
          <EmptyPanel message="No recent activity yet." />
        </div>
      )}
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <div className="h-56 animate-pulse rounded-3xl bg-slate-200/60" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200/60"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    </div>
  );
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-rose-100 bg-white px-6 py-16 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
          <AlertTriangleIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-ink">
          Unable to load dashboard
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className={buttonClasses("primary", "sm", "mt-5")}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function AdminDashboardView({ data }: { data: AdminDashboardData }) {
  const totalPatients = Number(
    data.metrics.find((metric) => metric.label === "Total patients")?.value ?? 0,
  );
  const totalDoctors = Number(
    data.metrics.find((metric) => metric.label === "Active doctors")?.value ??
      data.careTeam.length,
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <DashboardHero data={data} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric, index) => (
          <MetricCard key={metric.label} metric={metric} index={index} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <FollowUpChart series={data.followUpSeries} />
        <RiskMix riskMix={data.riskMix} totalPatients={totalPatients} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <RecentPatients patients={data.recentPatients} />
        <TodaySchedule appointments={data.appointments} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <CareTeam careTeam={data.careTeam} totalDoctors={totalDoctors} />
        <AttentionNeeded alerts={data.alerts} />
        <ActivityFeed activity={data.activity} />
      </section>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getAdminDashboard();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load the dashboard. Please try again.",
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (error) {
    return (
      <DashboardError
        message={error}
        onRetry={() => {
          setError(null);
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return <AdminDashboardView data={data} />;
}
