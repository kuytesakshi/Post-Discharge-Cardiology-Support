"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { PatientStatusConfirmDialog } from "@/components/admin/patients/patient-status-confirm-dialog";
import {
  profileStatusLabel,
  profileStatusTone,
  riskLabel,
  riskTone,
  formatDate,
  formatDateTime,
  initials,
  displayGender,
} from "@/components/admin/patients/patient-utils";
import { getAdminPatient, updateAdminPatient } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import type { AdminPatientDetail } from "@/types/admin";

type PatientDetailDrawerProps = {
  patientId: string;
  onClose: () => void;
  onEdit: (patientId: string) => void;
  onChanged: (message: string) => void;
};

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function PatientDetailDrawer({
  patientId,
  onClose,
  onEdit,
  onChanged,
}: PatientDetailDrawerProps) {
  const [detail, setDetail] = useState<AdminPatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);

  const closeStatusConfirm = useCallback(() => {
    if (isUpdating) {
      return;
    }
    setStatusConfirmOpen(false);
    setError(null);
  }, [isUpdating]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getAdminPatient(patientId);
        if (!cancelled) {
          setDetail(result);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Unable to load this patient.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  function requestStatusChange() {
    if (!detail || isUpdating) {
      return;
    }
    setError(null);
    setStatusConfirmOpen(true);
  }

  async function handleStatusChange() {
    if (!detail || isUpdating) {
      return;
    }

    const nextStatus =
      detail.profile.status === "inactive" ? "active" : "inactive";

    setIsUpdating(true);
    setError(null);

    try {
      const updated = await updateAdminPatient(detail.profile.id, {
        profile: { status: nextStatus },
      });
      setDetail(updated);
      setStatusConfirmOpen(false);
      onChanged(
        `${detail.user.name} ${
          nextStatus === "inactive" ? "deactivated" : "reactivated"
        }.`,
      );
    } catch (updateError) {
      setError(
        updateError instanceof ApiError
          ? updateError.message
          : "Unable to update this patient.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const isInactive = detail?.profile.status === "inactive";

  const drawer = (
    <Drawer
      open
      onClose={onClose}
      title={detail?.user.name ?? "Patient details"}
      description={detail?.user.email ?? "Loading patient record..."}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={requestStatusChange}
            disabled={!detail || isUpdating}
            className={
              isInactive
                ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                : "border-rose-300 text-rose-700 hover:bg-rose-50"
            }
          >
            {isUpdating
              ? "Updating..."
              : isInactive
                ? "Reactivate patient"
                : "Deactivate patient"}
          </Button>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => onEdit(patientId)}
              disabled={!detail}
            >
              Edit patient
            </Button>
          </div>
        </div>
      }
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-44 animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : detail ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-semibold text-white">
                {initials(detail.user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {detail.user.name}
                  </h2>
                  <Badge tone={profileStatusTone(detail.profile.status)}>
                    {profileStatusLabel(detail.profile.status)}
                  </Badge>
                  <Badge tone={riskTone[detail.risk]}>
                    {riskLabel[detail.risk]}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {detail.user.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {detail.profile.medical_record_number
                    ? `MRN ${detail.profile.medical_record_number}`
                    : "No medical record number"}
                </p>
              </div>
            </div>
          </div>

          <DetailSection title="Contact and demographics">
            <DetailRow label="Phone" value={detail.profile.phone ?? "—"} />
            <DetailRow
              label="Date of birth"
              value={formatDate(detail.profile.date_of_birth)}
            />
            <DetailRow
              label="Gender"
              value={displayGender(detail.profile.gender)}
            />
            <DetailRow
              label="Preferred language"
              value={detail.profile.preferred_language ?? "—"}
            />
            <DetailRow
              label="Preferred contact"
              value={detail.profile.preferred_contact_method ?? "—"}
            />
            <DetailRow
              label="Medical record number"
              value={detail.profile.medical_record_number ?? "—"}
            />
          </DetailSection>

          <DetailSection title="Clinical summary">
            <DetailRow
              label="Primary condition"
              value={detail.profile.primary_condition ?? "—"}
            />
            <DetailRow
              label="Discharge diagnosis"
              value={detail.profile.discharge_diagnosis ?? "—"}
            />
            <DetailRow
              label="Discharge date"
              value={formatDate(detail.profile.discharge_date)}
            />
            <DetailRow
              label="Next follow-up"
              value={formatDate(detail.profile.next_follow_up_date)}
            />
            <DetailRow
              label="Readmission risk"
              value={detail.profile.readmission_risk ?? "Not assessed"}
            />
            <DetailRow
              label="Risk score"
              value={
                detail.profile.readmission_risk_score === null
                  ? "—"
                  : String(detail.profile.readmission_risk_score)
              }
            />
            <DetailRow
              label="Clinical notes"
              value={detail.profile.clinical_notes ?? "—"}
              className="sm:col-span-2"
            />
          </DetailSection>

          <DetailSection title="Care team">
            <DetailRow
              label="Primary doctor"
              value={detail.primaryDoctorName ?? "Unassigned"}
            />
            <DetailRow
              label="Attending doctor"
              value={detail.attendingDoctorName ?? "Unassigned"}
            />
          </DetailSection>

          <DetailSection title="Consent and record">
            <DetailRow
              label="Consent to contact"
              value={detail.profile.consent_to_contact ? "Yes" : "No"}
            />
            <DetailRow
              label="Consent date"
              value={formatDate(detail.profile.consent_date)}
            />
            <DetailRow
              label="Created"
              value={formatDateTime(detail.profile.created_at)}
            />
            <DetailRow
              label="Last updated"
              value={formatDateTime(detail.profile.updated_at)}
            />
            <DetailRow
              label="Last contacted"
              value={formatDateTime(detail.profile.last_contacted_at)}
            />
            <DetailRow
              label="Onboarding completed"
              value={formatDateTime(detail.profile.onboarding_completed_at)}
            />
          </DetailSection>
        </div>
      ) : null}
    </Drawer>
  );

  return (
    <>
      {drawer}

      {detail ? (
        <PatientStatusConfirmDialog
          open={statusConfirmOpen}
          action={isInactive ? "reactivate" : "deactivate"}
          patientName={detail.user.name}
          patientEmail={detail.user.email}
          medicalRecordNumber={detail.profile.medical_record_number}
          currentStatus={detail.profile.status}
          risk={detail.risk}
          isSubmitting={isUpdating}
          error={statusConfirmOpen ? error : null}
          onCancel={closeStatusConfirm}
          onConfirm={() => void handleStatusChange()}
        />
      ) : null}
    </>
  );
}
