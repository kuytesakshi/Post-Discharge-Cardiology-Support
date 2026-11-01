"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AlertTriangleIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  EyeIcon,
  HeartPulseIcon,
  PencilIcon,
  RefreshIcon,
  SearchIcon,
  UserCheckIcon,
  UserPlusIcon,
  UserXIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PatientDetailDrawer } from "@/components/admin/patients/patient-detail-drawer";
import { PatientFormDrawer } from "@/components/admin/patients/patient-form-drawer";
import { PatientStatusConfirmDialog } from "@/components/admin/patients/patient-status-confirm-dialog";
import {
  displayGender,
  formatDate,
  initials,
  isFollowUpOverdue,
  profileStatusLabel,
  profileStatusTone,
  riskLabel,
  riskTone,
} from "@/components/admin/patients/patient-utils";
import {
  getAdminDoctorOptions,
  getAdminPatients,
  updateAdminPatient,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  AdminDoctorOption,
  AdminPatientListItem,
  AdminPatientListResponse,
} from "@/types/admin";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const EMPTY_FILTERS = { status: "", risk: "", doctorId: "" };

type Filters = typeof EMPTY_FILTERS;
type SummaryTone = "teal" | "emerald" | "amber" | "rose";

const summaryToneClasses: Record<SummaryTone, string> = {
  teal: "bg-teal-50 text-teal-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

function SummaryCard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  helper: string;
  tone: SummaryTone;
  icon: typeof UsersIcon;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            summaryToneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-4 py-4"
          aria-hidden="true"
        >
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="hidden h-8 w-24 animate-pulse rounded bg-slate-100 sm:block" />
          <div className="hidden h-8 w-20 animate-pulse rounded bg-slate-100 lg:block" />
        </div>
      ))}
    </div>
  );
}

export function PatientMaster() {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<AdminPatientListResponse | null>(null);
  const [doctors, setDoctors] = useState<AdminDoctorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formPatientId, setFormPatientId] = useState<string | null>(null);
  const [busyPatientId, setBusyPatientId] = useState<string | null>(null);
  const [statusConfirm, setStatusConfirm] = useState<{
    patient: AdminPatientListItem;
    nextStatus: "active" | "inactive";
  } | null>(null);
  const [statusConfirmError, setStatusConfirmError] = useState<string | null>(
    null,
  );
  const lastSearchRef = useRef("");

  useEffect(() => {
    const nextSearch = searchInput.trim();
    const timer = window.setTimeout(() => {
      if (lastSearchRef.current === nextSearch) {
        return;
      }
      lastSearchRef.current = nextSearch;
      setDebouncedSearch(nextSearch);
      setPage(1);
      setIsLoading(true);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getAdminPatients({
          search: debouncedSearch,
          status: filters.status,
          risk: filters.risk,
          doctorId: filters.doctorId,
          page,
          pageSize,
        });

        if (cancelled) {
          return;
        }

        const lastPage = Math.max(result.totalPages, 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        setData(result);
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : "Unable to load patients.",
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
  }, [
    debouncedSearch,
    filters.status,
    filters.risk,
    filters.doctorId,
    page,
    pageSize,
    reloadKey,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const options = await getAdminDoctorOptions();
        if (!cancelled) {
          setDoctors(options);
        }
      } catch {
        if (!cancelled) {
          setDoctors([]);
        }
      }
    }

    void loadDoctors();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    setReloadKey((current) => current + 1);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailPatientId(null);
  }, []);

  const closeForm = useCallback(() => {
    setFormMode(null);
    setFormPatientId(null);
  }, []);

  const openEdit = useCallback((patientId: string) => {
    setDetailPatientId(null);
    setFormPatientId(patientId);
    setFormMode("edit");
  }, []);

  const handleSaved = useCallback((message: string) => {
    setFormMode(null);
    setFormPatientId(null);
    setNotice(message);
    setIsLoading(true);
    setReloadKey((current) => current + 1);
  }, []);

  const handleChanged = useCallback((message: string) => {
    setNotice(message);
    setIsLoading(true);
    setReloadKey((current) => current + 1);
  }, []);

  function handleFilterChange(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
    setIsLoading(true);
  }

  function clearFilters() {
    setSearchInput("");
    setDebouncedSearch("");
    lastSearchRef.current = "";
    setFilters(EMPTY_FILTERS);
    setPage(1);
    setIsLoading(true);
  }

  function goToPage(nextPage: number) {
    if (!data || nextPage < 1 || nextPage > data.totalPages) {
      return;
    }
    setPage(nextPage);
    setIsLoading(true);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
    setIsLoading(true);
  }

  function requestRowStatus(patient: AdminPatientListItem) {
    const nextStatus =
      patient.status === "inactive" ? "active" : "inactive";
    setStatusConfirmError(null);
    setStatusConfirm({ patient, nextStatus });
  }

  const closeStatusConfirm = useCallback(() => {
    if (busyPatientId) {
      return;
    }
    setStatusConfirm(null);
    setStatusConfirmError(null);
  }, [busyPatientId]);

  async function confirmRowStatus() {
    if (!statusConfirm) {
      return;
    }

    const { patient, nextStatus } = statusConfirm;
    setBusyPatientId(patient.id);
    setStatusConfirmError(null);

    try {
      await updateAdminPatient(patient.id, {
        profile: { status: nextStatus },
      });
      setNotice(
        `${patient.name} ${
          nextStatus === "inactive" ? "deactivated" : "reactivated"
        }.`,
      );
      setStatusConfirm(null);
      setIsLoading(true);
      setReloadKey((current) => current + 1);
    } catch (updateError) {
      setStatusConfirmError(
        updateError instanceof ApiError
          ? updateError.message
          : "Unable to update this patient.",
      );
    } finally {
      setBusyPatientId(null);
    }
  }

  const summary = data?.summary ?? {
    total: 0,
    active: 0,
    highRisk: 0,
    overdueFollowUps: 0,
  };
  const items = data?.items ?? [];
  const hasFilters = Boolean(
    searchInput.trim() || filters.status || filters.risk || filters.doctorId,
  );
  const start = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const end = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
            Care operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Patient Master
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Manage every patient account, discharge risk, follow-up plan, and
            care team assignment.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={isLoading}
          >
            <RefreshIcon
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={() => {
              setFormPatientId(null);
              setFormMode("create");
            }}
          >
            <UserPlusIcon className="h-4 w-4" />
            Add patient
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total patients"
          value={summary.total}
          helper="Across all statuses"
          tone="teal"
          icon={UsersIcon}
        />
        <SummaryCard
          label="Active patients"
          value={summary.active}
          helper="Currently in follow-up"
          tone="emerald"
          icon={HeartPulseIcon}
        />
        <SummaryCard
          label="High risk"
          value={summary.highRisk}
          helper="Readmission risk is high"
          tone="rose"
          icon={AlertTriangleIcon}
        />
        <SummaryCard
          label="Overdue follow-ups"
          value={summary.overdueFollowUps}
          helper="Past the next follow-up date"
          tone="amber"
          icon={CalendarIcon}
        />
      </section>

      <Card className="overflow-hidden p-0!" aria-busy={isLoading}>
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, email, MRN, or phone"
                className="h-10! pl-9"
                aria-label="Search patients"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex">
              <Select
                value={filters.status}
                onChange={(event) =>
                  handleFilterChange("status", event.target.value)
                }
                className="h-10! xl:w-36"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="discharged">Discharged</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select
                value={filters.risk}
                onChange={(event) =>
                  handleFilterChange("risk", event.target.value)
                }
                className="h-10! xl:w-36"
                aria-label="Filter by risk"
              >
                <option value="">All risk levels</option>
                <option value="high">High risk</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low risk</option>
              </Select>
              <Select
                value={filters.doctorId}
                onChange={(event) =>
                  handleFilterChange("doctorId", event.target.value)
                }
                className="h-10! xl:w-44"
                aria-label="Filter by doctor"
              >
                <option value="">All doctors</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="h-10!"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {isLoading && data ? (
          <div className="h-0.5 w-full animate-pulse bg-teal-500" />
        ) : null}

        {error ? (
          <div
            role="alert"
            className="flex flex-col gap-2 border-b border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={refresh}
              className="self-start font-medium underline underline-offset-2 sm:self-auto"
            >
              Retry
            </button>
          </div>
        ) : null}

        {isLoading && !data ? (
          <TableSkeleton />
        ) : error && !data ? (
          <div className="px-4 py-10 text-center text-sm text-slate-600">
            Unable to load patients. Use Retry above to try again.
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No patients found"
              description={
                hasFilters
                  ? "Try changing your search or filters, or add a new patient."
                  : "No patients are in the master list yet. Add the first patient to get started."
              }
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {hasFilters ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => {
                      setFormPatientId(null);
                      setFormMode("create");
                    }}
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Add patient
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Risk</th>
                  <th className="px-4 py-3 font-medium">Care team</th>
                  <th className="px-4 py-3 font-medium">Next follow-up</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="sticky right-0 z-10 min-w-[230px] border-l border-slate-200 bg-slate-50 px-2 py-3 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((patient) => (
                  <tr
                    key={patient.id}
                    className="bg-white align-top transition-colors hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                          {initials(patient.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {patient.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {patient.medicalRecordNumber
                              ? `MRN ${patient.medicalRecordNumber}`
                              : "No MRN"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {[
                              patient.age === null
                                ? null
                                : `${patient.age} yrs`,
                              displayGender(patient.gender),
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-[200px] truncate text-slate-700">
                        {patient.email}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {patient.phone ?? "No phone"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-[160px] text-slate-700">
                        {patient.primaryCondition ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={riskTone[patient.risk]}>
                        {riskLabel[patient.risk]}
                      </Badge>
                      {patient.readmissionRiskScore !== null ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Score {patient.readmissionRiskScore}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-[160px] text-slate-700">
                        {patient.primaryDoctorName ?? "Unassigned"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p
                        className={cn(
                          "font-medium",
                          isFollowUpOverdue(patient)
                            ? "text-rose-600"
                            : "text-slate-700",
                        )}
                      >
                        {patient.nextFollowUp}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(patient.nextFollowUpDate)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={profileStatusTone(patient.status)}>
                        {profileStatusLabel(patient.status)}
                      </Badge>
                    </td>
                    <td className="sticky right-0 z-10 min-w-[230px] border-l border-slate-100 bg-inherit px-2 py-4 shadow-[-10px_0_15px_-15px_rgba(15,23,42,0.3)]">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailPatientId(patient.id)}
                          className={buttonClasses(
                            "outline",
                            "sm",
                            "h-8! px-2! text-xs!",
                          )}
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(patient.id)}
                          className={buttonClasses(
                            "outline",
                            "sm",
                            "h-8! px-2! text-xs!",
                          )}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => requestRowStatus(patient)}
                          disabled={busyPatientId === patient.id}
                          className={buttonClasses(
                            "outline",
                            "sm",
                            cn(
                              "h-8! px-2! text-xs!",
                              patient.status === "inactive"
                                ? "border-emerald-300! text-emerald-700! hover:bg-emerald-50!"
                                : "border-rose-300! text-rose-700! hover:bg-rose-50!",
                            ),
                          )}
                        >
                          {patient.status === "inactive" ? (
                            <UserCheckIcon className="h-3.5 w-3.5" />
                          ) : (
                            <UserXIcon className="h-3.5 w-3.5" />
                          )}
                          {busyPatientId === patient.id
                            ? "..."
                            : patient.status === "inactive"
                              ? "Reactivate"
                              : "Deactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {start}–{end}
              </span>{" "}
              of <span className="font-medium text-slate-700">{data.total}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Rows
                <Select
                  value={String(pageSize)}
                  onChange={(event) =>
                    handlePageSizeChange(event.target.value)
                  }
                  className="h-9! w-20! text-xs!"
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isLoading}
                  className={buttonClasses(
                    "outline",
                    "sm",
                    "h-8! w-8! px-0!",
                  )}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs text-slate-600">
                  Page {data.page} of {Math.max(data.totalPages, 1)}
                </span>
                <button
                  type="button"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= data.totalPages || isLoading}
                  className={buttonClasses(
                    "outline",
                    "sm",
                    "h-8! w-8! px-0!",
                  )}
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {detailPatientId ? (
        <PatientDetailDrawer
          patientId={detailPatientId}
          onClose={closeDetail}
          onEdit={openEdit}
          onChanged={handleChanged}
        />
      ) : null}

      {formMode ? (
        <PatientFormDrawer
          mode={formMode}
          patientId={formPatientId}
          doctors={doctors}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      ) : null}

      {statusConfirm ? (
        <PatientStatusConfirmDialog
          open
          action={
            statusConfirm.nextStatus === "inactive"
              ? "deactivate"
              : "reactivate"
          }
          patientName={statusConfirm.patient.name}
          patientEmail={statusConfirm.patient.email}
          medicalRecordNumber={statusConfirm.patient.medicalRecordNumber}
          currentStatus={statusConfirm.patient.status}
          risk={statusConfirm.patient.risk}
          isSubmitting={busyPatientId === statusConfirm.patient.id}
          error={statusConfirmError}
          onCancel={closeStatusConfirm}
          onConfirm={() => void confirmRowStatus()}
        />
      ) : null}

      {notice ? (
        <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="flex-1 text-sm text-slate-700">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
