"use client";

import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  AlertTriangleIcon,
  CheckIcon,
  CloseIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserXIcon,
} from "@/components/ui/icons";
import {
  initials,
  profileStatusLabel,
  profileStatusTone,
  riskLabel,
  riskTone,
} from "@/components/admin/patients/patient-utils";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/admin";

export type PatientStatusAction = "deactivate" | "reactivate";

type PatientStatusConfirmDialogProps = {
  open: boolean;
  action: PatientStatusAction;
  patientName: string;
  patientEmail?: string;
  medicalRecordNumber?: string | null;
  currentStatus?: string;
  risk?: RiskLevel;
  isSubmitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const consequences: Record<PatientStatusAction, string[]> = {
  deactivate: [
    "Patient portal sign-in will be paused immediately.",
    "Follow-up reminders and messages will stop.",
    "The clinical record stays intact and can be restored.",
  ],
  reactivate: [
    "Patient portal access will be restored.",
    "Follow-up reminders and messages can resume.",
    "The care team can reach the patient again.",
  ],
};

export function PatientStatusConfirmDialog({
  open,
  action,
  patientName,
  patientEmail,
  medicalRecordNumber,
  currentStatus,
  risk,
  isSubmitting = false,
  error,
  onCancel,
  onConfirm,
}: PatientStatusConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const isDeactivate = action === "deactivate";
  const ActionIcon = isDeactivate ? UserXIcon : UserCheckIcon;
  const title = isDeactivate
    ? "Deactivate this patient?"
    : "Reactivate this patient?";
  const eyebrow = isDeactivate ? "High-impact access change" : "Restore access";
  const description = isDeactivate
    ? "This pauses portal access and follow-up contact until the patient is reactivated."
    : "This restores portal access and lets the care team resume follow-up contact.";

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, isSubmitting, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close confirmation"
        onClick={onCancel}
        disabled={isSubmitting}
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-md"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-confirm-title"
        aria-describedby="status-confirm-description"
        className="animate-fade-up relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_32px_120px_-24px_rgba(2,6,23,0.9)]"
      >
        <div
          className={cn(
            "relative overflow-hidden px-6 pb-7 pt-6 text-white",
            isDeactivate
              ? "bg-gradient-to-br from-rose-700 via-rose-600 to-orange-500"
              : "bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-500",
          )}
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-black/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.12)_45%,transparent_70%)]" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
                <span className="animate-glow-pulse absolute inset-0 rounded-2xl bg-white/25" />
                <ActionIcon className="relative h-7 w-7" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                  {eyebrow}
                </p>
                <h2
                  id="status-confirm-title"
                  className="mt-1 text-2xl font-semibold tracking-tight"
                >
                  {title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              aria-label="Close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 ring-1 ring-white/20 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <p
            id="status-confirm-description"
            className="relative mt-4 max-w-md text-sm leading-6 text-white/85"
          >
            {description}
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          {error ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            >
              <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                isDeactivate
                  ? "bg-rose-100 text-rose-700"
                  : "bg-emerald-100 text-emerald-700",
              )}
            >
              {initials(patientName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {patientName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {patientEmail || "No email on file"}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {medicalRecordNumber
                  ? `MRN ${medicalRecordNumber}`
                  : "No medical record number"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {currentStatus ? (
                <Badge tone={profileStatusTone(currentStatus)}>
                  {profileStatusLabel(currentStatus)}
                </Badge>
              ) : null}
              {risk ? (
                <Badge tone={riskTone[risk]}>{riskLabel[risk]}</Badge>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {isDeactivate ? "What changes" : "What comes back"}
            </p>
            <ul className="mt-3 space-y-2.5">
              {consequences[action].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      isDeactivate
                        ? "bg-rose-50 text-rose-600"
                        : "bg-emerald-50 text-emerald-600",
                    )}
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-3 text-sm",
              isDeactivate
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-teal-200 bg-teal-50 text-teal-900",
            )}
          >
            <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <span className="font-semibold">No medical data is deleted.</span>{" "}
              This only changes portal access and follow-up contact.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className={buttonClasses("outline", "md")}
          >
            {isDeactivate ? "Keep patient active" : "Keep inactive"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={buttonClasses(
              "primary",
              "md",
              cn(
                "min-w-[190px]",
                isDeactivate
                  ? "bg-rose-600! hover:bg-rose-700! focus-visible:outline-rose-600!"
                  : "bg-emerald-600! hover:bg-emerald-700! focus-visible:outline-emerald-600!",
              ),
            )}
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <ActionIcon className="h-4 w-4" />
            )}
            {isSubmitting
              ? "Updating..."
              : isDeactivate
                ? "Yes, deactivate patient"
                : "Yes, reactivate patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
