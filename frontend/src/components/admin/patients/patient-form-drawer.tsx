"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import { DateOfBirthField } from "@/components/admin/patients/date-of-birth-field";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  createAdminPatient,
  getAdminPatient,
  updateAdminPatient,
} from "@/lib/admin-api";
import { ApiError } from "@/lib/api";
import {
  MAX_NOTES_LENGTH,
  normalizeName,
  todayIso,
  validateDateNotFuture,
  validateDateOfBirth,
  validateDateOrder,
  validateDateValue,
  validateEmail,
  validateLettersOnly,
  validateMedicalText,
  validateMrn,
  validateName,
  validatePhone,
  validateRiskScore,
  validateTextLength,
} from "@/lib/validation";
import type { AdminDoctorOption } from "@/types/admin";

type PatientFormDrawerProps = {
  mode: "create" | "edit";
  patientId: string | null;
  doctors: AdminDoctorOption[];
  onClose: () => void;
  onSaved: (message: string) => void;
};

type PatientFormState = {
  name: string;
  email: string;
  password: string;
  status: string;
  medicalRecordNumber: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  preferredLanguage: string;
  preferredContactMethod: string;
  primaryCondition: string;
  dischargeDiagnosis: string;
  dischargeDate: string;
  readmissionRisk: string;
  readmissionRiskScore: string;
  nextFollowUpDate: string;
  primaryDoctorId: string;
  attendingDoctorId: string;
  clinicalNotes: string;
  consentToContact: boolean;
  consentDate: string;
};

function createEmptyForm(): PatientFormState {
  return {
    name: "",
    email: "",
    password: "",
    status: "active",
    medicalRecordNumber: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    preferredLanguage: "",
    preferredContactMethod: "",
    primaryCondition: "",
    dischargeDiagnosis: "",
    dischargeDate: "",
    readmissionRisk: "",
    readmissionRiskScore: "",
    nextFollowUpDate: "",
    primaryDoctorId: "",
    attendingDoctorId: "",
    clinicalNotes: "",
    consentToContact: false,
    consentDate: todayIso(),
  };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function formFromDetail(detail: Awaited<ReturnType<typeof getAdminPatient>>): PatientFormState {
  const { profile } = detail;

  return {
    name: detail.user.name,
    email: detail.user.email,
    password: "",
    status: profile.status || "active",
    medicalRecordNumber: profile.medical_record_number ?? "",
    dateOfBirth: profile.date_of_birth ?? "",
    gender: profile.gender ?? "",
    phone: profile.phone ?? "",
    preferredLanguage: profile.preferred_language ?? "",
    preferredContactMethod: profile.preferred_contact_method ?? "",
    primaryCondition: profile.primary_condition ?? "",
    dischargeDiagnosis: profile.discharge_diagnosis ?? "",
    dischargeDate: profile.discharge_date ?? "",
    readmissionRisk: profile.readmission_risk ?? "",
    readmissionRiskScore:
      profile.readmission_risk_score === null
        ? ""
        : String(profile.readmission_risk_score),
    nextFollowUpDate: profile.next_follow_up_date ?? "",
    primaryDoctorId: profile.primary_doctor_id ?? "",
    attendingDoctorId: profile.attending_doctor_id ?? "",
    clinicalNotes: profile.clinical_notes ?? "",
    consentToContact: profile.consent_to_contact,
    consentDate:
      profile.consent_date ??
      (profile.consent_to_contact ? todayIso() : ""),
  };
}

function Field({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className ? `space-y-1.5 ${className}` : "space-y-1.5"}>
      <span className="block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </span>
      {children}
      {error ? (
        <span className="block text-xs font-medium text-rose-600">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-slate-200 pb-6 last:border-0 last:pb-0">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function PatientFormDrawer({
  mode,
  patientId,
  doctors,
  onClose,
  onSaved,
}: PatientFormDrawerProps) {
  const [form, setForm] = useState<PatientFormState>(createEmptyForm);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof PatientFormState, string>>
  >({});
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !patientId) {
      return;
    }

    let cancelled = false;
    const id = patientId;

    async function load() {
      try {
        const detail = await getAdminPatient(id);
        if (!cancelled) {
          setForm(formFromDetail(detail));
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
  }, [mode, patientId]);

  function updateField<K extends keyof PatientFormState>(
    key: K,
    value: PatientFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError(null);
  }

  function handleConsentChange(checked: boolean) {
    setForm((current) => ({
      ...current,
      consentToContact: checked,
      consentDate: checked ? current.consentDate || todayIso() : "",
    }));
    setFieldErrors((current) => {
      if (!("consentDate" in current)) {
        return current;
      }
      const next = { ...current };
      delete next.consentDate;
      return next;
    });
    setError(null);
  }

  function invalidClass(field: keyof PatientFormState): string | undefined {
    return fieldErrors[field]
      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
      : undefined;
  }

  function validateForm(): Partial<Record<keyof PatientFormState, string>> {
    const errors: Partial<Record<keyof PatientFormState, string>> = {};

    const nameError = validateName(form.name);
    if (nameError) {
      errors.name = nameError;
    }

    const emailError = validateEmail(form.email);
    if (emailError) {
      errors.email = emailError;
    }

    if (mode === "create") {
      if (!form.password) {
        errors.password = "Temporary password is required.";
      } else if (form.password.length < 8) {
        errors.password = "Temporary password must be at least 8 characters.";
      } else if (form.password.length > 128) {
        errors.password = "Temporary password must be 128 characters or fewer.";
      }
    }

    if (!["active", "discharged", "inactive"].includes(form.status)) {
      errors.status = "Select a valid account status.";
    }

    const mrnError = validateMrn(form.medicalRecordNumber);
    if (mrnError) {
      errors.medicalRecordNumber = mrnError;
    }

    const dobError = validateDateOfBirth(form.dateOfBirth);
    if (dobError) {
      errors.dateOfBirth = dobError;
    }

    if (
      form.gender &&
      !["female", "male", "non_binary", "prefer_not_to_say"].includes(
        form.gender,
      )
    ) {
      errors.gender = "Select a valid gender.";
    }

    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      errors.phone = phoneError;
    }

    const languageError = validateLettersOnly(
      form.preferredLanguage,
      "Preferred language",
    );
    if (languageError) {
      errors.preferredLanguage = languageError;
    }

    if (
      form.preferredContactMethod &&
      !["phone", "sms", "email", "portal"].includes(
        form.preferredContactMethod,
      )
    ) {
      errors.preferredContactMethod = "Select a valid contact method.";
    }

    const conditionError = validateMedicalText(
      form.primaryCondition,
      "Primary condition",
    );
    if (conditionError) {
      errors.primaryCondition = conditionError;
    }

    const diagnosisError = validateTextLength(
      form.dischargeDiagnosis,
      "Discharge diagnosis",
      MAX_NOTES_LENGTH,
    );
    if (diagnosisError) {
      errors.dischargeDiagnosis = diagnosisError;
    }

    const dischargeDateError = validateDateNotFuture(
      form.dischargeDate,
      "Discharge date",
    );
    if (dischargeDateError) {
      errors.dischargeDate = dischargeDateError;
    }

    const followUpDateError = validateDateValue(
      form.nextFollowUpDate,
      "Next follow-up",
    );
    if (followUpDateError) {
      errors.nextFollowUpDate = followUpDateError;
    }

    if (
      form.readmissionRisk &&
      !["low", "moderate", "high"].includes(form.readmissionRisk)
    ) {
      errors.readmissionRisk = "Select a valid readmission risk.";
    }

    const riskScoreError = validateRiskScore(form.readmissionRiskScore);
    if (riskScoreError) {
      errors.readmissionRiskScore = riskScoreError;
    }

    const notesError = validateTextLength(
      form.clinicalNotes,
      "Clinical notes",
      MAX_NOTES_LENGTH,
    );
    if (notesError) {
      errors.clinicalNotes = notesError;
    }

    const dobToDischargeError = validateDateOrder(
      form.dateOfBirth,
      form.dischargeDate,
      "Discharge date cannot be before date of birth.",
    );
    if (dobToDischargeError) {
      errors.dischargeDate = dobToDischargeError;
    }

    const dischargeToFollowUpError = validateDateOrder(
      form.dischargeDate,
      form.nextFollowUpDate,
      "Next follow-up cannot be before the discharge date.",
    );
    if (dischargeToFollowUpError) {
      errors.nextFollowUpDate = dischargeToFollowUpError;
    }

    if (form.consentToContact && !form.consentDate) {
      errors.consentDate = "Consent date is required when consent is recorded.";
    }

    const consentDateError = validateDateNotFuture(
      form.consentDate,
      "Consent date",
    );
    if (consentDateError) {
      errors.consentDate = consentDateError;
    }

    if (
      form.primaryDoctorId &&
      !doctors.some((doctor) => doctor.id === form.primaryDoctorId)
    ) {
      errors.primaryDoctorId = "Select a valid primary doctor.";
    }

    if (
      form.attendingDoctorId &&
      !doctors.some((doctor) => doctor.id === form.attendingDoctorId)
    ) {
      errors.attendingDoctorId = "Select a valid attending doctor.";
    }

    return errors;
  }

  function focusFirstInvalidField() {
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  function mapBackendErrors(
    saveError: ApiError,
  ): Partial<Record<keyof PatientFormState, string>> {
    const fieldMap: Record<string, keyof PatientFormState> = {
      name: "name",
      email: "email",
      password: "password",
      status: "status",
      medical_record_number: "medicalRecordNumber",
      date_of_birth: "dateOfBirth",
      gender: "gender",
      phone: "phone",
      preferred_language: "preferredLanguage",
      preferred_contact_method: "preferredContactMethod",
      primary_condition: "primaryCondition",
      discharge_diagnosis: "dischargeDiagnosis",
      discharge_date: "dischargeDate",
      readmission_risk: "readmissionRisk",
      readmission_risk_score: "readmissionRiskScore",
      next_follow_up_date: "nextFollowUpDate",
      primary_doctor_id: "primaryDoctorId",
      attending_doctor_id: "attendingDoctorId",
      clinical_notes: "clinicalNotes",
      consent_to_contact: "consentToContact",
      consent_date: "consentDate",
    };
    const mapped: Partial<Record<keyof PatientFormState, string>> = {};

    for (const detail of saveError.details ?? []) {
      const field = detail.loc?.[detail.loc.length - 1];
      if (typeof field !== "string") {
        continue;
      }
      const formKey = fieldMap[field];
      if (!formKey || !detail.msg) {
        continue;
      }
      mapped[formKey] = detail.msg.replace(/^Value error,\s*/i, "");
    }

    return mapped;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setError("Please fix the highlighted fields.");
      focusFirstInvalidField();
      return;
    }

    setFieldErrors({});
    const score = form.readmissionRiskScore.trim();
    const parsedScore = score === "" ? null : Number(score);

    setIsSaving(true);

    const profile = {
      status: form.status,
      medical_record_number: emptyToNull(form.medicalRecordNumber),
      date_of_birth: emptyToNull(form.dateOfBirth),
      gender: emptyToNull(form.gender),
      phone: emptyToNull(form.phone),
      preferred_language: emptyToNull(form.preferredLanguage),
      preferred_contact_method: emptyToNull(form.preferredContactMethod),
      primary_condition: emptyToNull(form.primaryCondition),
      discharge_diagnosis: emptyToNull(form.dischargeDiagnosis),
      discharge_date: emptyToNull(form.dischargeDate),
      readmission_risk: emptyToNull(form.readmissionRisk),
      readmission_risk_score: parsedScore,
      next_follow_up_date: emptyToNull(form.nextFollowUpDate),
      primary_doctor_id: emptyToNull(form.primaryDoctorId),
      attending_doctor_id:
        emptyToNull(form.attendingDoctorId) ??
        emptyToNull(form.primaryDoctorId),
      clinical_notes: emptyToNull(form.clinicalNotes),
      consent_to_contact: form.consentToContact,
      consent_date: emptyToNull(form.consentDate),
    };

    try {
      if (mode === "create") {
        await createAdminPatient({
          name: normalizeName(form.name),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          profile,
        });
        onSaved("Patient created successfully.");
      } else if (patientId) {
        await updateAdminPatient(patientId, {
          name: normalizeName(form.name),
          email: form.email.trim().toLowerCase(),
          profile,
        });
        onSaved("Patient updated successfully.");
      }
    } catch (saveError) {
      if (saveError instanceof ApiError) {
        const mapped = mapBackendErrors(saveError);
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
          setError("Please fix the highlighted fields.");
          focusFirstInvalidField();
          return;
        }
        if (saveError.message === "Email is already registered") {
          setFieldErrors({ email: saveError.message });
          setError("Please fix the highlighted fields.");
          focusFirstInvalidField();
          return;
        }
        if (
          saveError.message === "Medical record number is already in use"
        ) {
          setFieldErrors({ medicalRecordNumber: saveError.message });
          setError("Please fix the highlighted fields.");
          focusFirstInvalidField();
          return;
        }
        setError(saveError.message);
      } else {
        setError("Unable to save this patient.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      size="lg"
      title={mode === "create" ? "Add patient" : "Edit patient"}
      description={
        mode === "create"
          ? "Create the account and capture the core post-discharge details."
          : "Update the account, clinical details, and care team."
      }
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="patient-form"
            disabled={isSaving || isLoading}
          >
            {isSaving
              ? "Saving..."
              : mode === "create"
                ? "Create patient"
                : "Save changes"}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((__, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className="h-11 animate-pulse rounded-lg bg-slate-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form
          id="patient-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6"
        >
          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </div>
          ) : null}

          <FormSection
            title="Account"
            description="The sign-in identity for the patient portal."
          >
            <Field
              label="Full name"
              required
              error={fieldErrors.name}
            >
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="e.g. Aisha Rahman"
                aria-invalid={Boolean(fieldErrors.name)}
                className={invalidClass("name")}
                required
              />
            </Field>
            <Field
              label="Email address"
              required
              error={fieldErrors.email}
            >
              <Input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="patient@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className={invalidClass("email")}
                required
              />
            </Field>
            {mode === "create" ? (
              <Field
                label="Temporary password"
                required
                hint="The patient can change this after signing in."
                error={fieldErrors.password}
              >
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  placeholder="At least 8 characters"
                  minLength={8}
                  aria-invalid={Boolean(fieldErrors.password)}
                  className={invalidClass("password")}
                  required
                />
              </Field>
            ) : null}
            <Field label="Account status" error={fieldErrors.status}>
              <Select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                aria-invalid={Boolean(fieldErrors.status)}
                className={invalidClass("status")}
              >
                <option value="active">Active</option>
                <option value="discharged">Discharged</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
            <Field
              label="Medical record number"
              error={fieldErrors.medicalRecordNumber}
            >
              <Input
                value={form.medicalRecordNumber}
                onChange={(event) =>
                  updateField("medicalRecordNumber", event.target.value)
                }
                placeholder="e.g. MRN-10482"
                aria-invalid={Boolean(fieldErrors.medicalRecordNumber)}
                className={invalidClass("medicalRecordNumber")}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Demographics and contact"
            description="How the care team reaches the patient."
          >
            <Field
              label="Date of birth"
              hint="Select month, day, and year."
              error={fieldErrors.dateOfBirth}
            >
              <DateOfBirthField
                key={
                  mode === "edit"
                    ? `${patientId ?? "edit"}-${isLoading ? "loading" : "ready"}`
                    : "create"
                }
                value={form.dateOfBirth}
                onChange={(value) => updateField("dateOfBirth", value)}
                error={fieldErrors.dateOfBirth}
              />
            </Field>
            <Field label="Gender" error={fieldErrors.gender}>
              <Select
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value)}
                aria-invalid={Boolean(fieldErrors.gender)}
                className={invalidClass("gender")}
              >
                <option value="">Not recorded</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </Select>
            </Field>
            <Field label="Phone" error={fieldErrors.phone}>
              <Input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+1-555-0100"
                aria-invalid={Boolean(fieldErrors.phone)}
                className={invalidClass("phone")}
              />
            </Field>
            <Field
              label="Preferred language"
              error={fieldErrors.preferredLanguage}
            >
              <Input
                value={form.preferredLanguage}
                onChange={(event) =>
                  updateField("preferredLanguage", event.target.value)
                }
                placeholder="e.g. English"
                aria-invalid={Boolean(fieldErrors.preferredLanguage)}
                className={invalidClass("preferredLanguage")}
              />
            </Field>
            <Field
              label="Preferred contact method"
              error={fieldErrors.preferredContactMethod}
            >
              <Select
                value={form.preferredContactMethod}
                onChange={(event) =>
                  updateField("preferredContactMethod", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.preferredContactMethod)}
                className={invalidClass("preferredContactMethod")}
              >
                <option value="">Not recorded</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="portal">Patient portal</option>
              </Select>
            </Field>
          </FormSection>

          <FormSection
            title="Clinical summary"
            description="Core discharge and follow-up details."
          >
            <Field
              label="Primary condition"
              className="sm:col-span-2"
              error={fieldErrors.primaryCondition}
            >
              <Input
                value={form.primaryCondition}
                onChange={(event) =>
                  updateField("primaryCondition", event.target.value)
                }
                placeholder="e.g. Heart failure"
                aria-invalid={Boolean(fieldErrors.primaryCondition)}
                className={invalidClass("primaryCondition")}
              />
            </Field>
            <Field
              label="Discharge diagnosis"
              className="sm:col-span-2"
              error={fieldErrors.dischargeDiagnosis}
            >
              <Input
                value={form.dischargeDiagnosis}
                onChange={(event) =>
                  updateField("dischargeDiagnosis", event.target.value)
                }
                placeholder="e.g. Acute decompensated heart failure"
                aria-invalid={Boolean(fieldErrors.dischargeDiagnosis)}
                className={invalidClass("dischargeDiagnosis")}
              />
            </Field>
            <Field label="Discharge date" error={fieldErrors.dischargeDate}>
              <Input
                type="date"
                value={form.dischargeDate}
                onChange={(event) =>
                  updateField("dischargeDate", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.dischargeDate)}
                className={invalidClass("dischargeDate")}
              />
            </Field>
            <Field
              label="Next follow-up"
              error={fieldErrors.nextFollowUpDate}
            >
              <Input
                type="date"
                value={form.nextFollowUpDate}
                onChange={(event) =>
                  updateField("nextFollowUpDate", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.nextFollowUpDate)}
                className={invalidClass("nextFollowUpDate")}
              />
            </Field>
            <Field
              label="Readmission risk"
              error={fieldErrors.readmissionRisk}
            >
              <Select
                value={form.readmissionRisk}
                onChange={(event) =>
                  updateField("readmissionRisk", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.readmissionRisk)}
                className={invalidClass("readmissionRisk")}
              >
                <option value="">Not assessed</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </Select>
            </Field>
            <Field
              label="Risk score"
              hint="Optional 0–10 score."
              error={fieldErrors.readmissionRiskScore}
            >
              <Input
                type="number"
                min={0}
                max={10}
                step={1}
                value={form.readmissionRiskScore}
                onChange={(event) =>
                  updateField("readmissionRiskScore", event.target.value)
                }
                placeholder="e.g. 7"
                aria-invalid={Boolean(fieldErrors.readmissionRiskScore)}
                className={invalidClass("readmissionRiskScore")}
              />
            </Field>
            <Field
              label="Clinical notes"
              className="sm:col-span-2"
              error={fieldErrors.clinicalNotes}
            >
              <textarea
                value={form.clinicalNotes}
                onChange={(event) =>
                  updateField("clinicalNotes", event.target.value)
                }
                placeholder="Add context the care team should know."
                rows={4}
                aria-invalid={Boolean(fieldErrors.clinicalNotes)}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.clinicalNotes
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                    : "border-slate-300 focus:border-teal-500 focus:ring-teal-100"
                }`}
              />
            </Field>
          </FormSection>

          <FormSection
            title="Care team"
            description="Assign the doctors responsible for this patient."
          >
            <Field
              label="Primary doctor"
              error={fieldErrors.primaryDoctorId}
            >
              <Select
                value={form.primaryDoctorId}
                onChange={(event) =>
                  updateField("primaryDoctorId", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.primaryDoctorId)}
                className={invalidClass("primaryDoctorId")}
              >
                <option value="">Unassigned</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                    {doctor.specialty ? ` — ${doctor.specialty}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Attending doctor"
              hint="Leave blank to use the primary doctor."
              error={fieldErrors.attendingDoctorId}
            >
              <Select
                value={form.attendingDoctorId}
                onChange={(event) =>
                  updateField("attendingDoctorId", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.attendingDoctorId)}
                className={invalidClass("attendingDoctorId")}
              >
                <option value="">Same as primary</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                    {doctor.specialty ? ` — ${doctor.specialty}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>

          <FormSection
            title="Consent"
            description="Record whether the patient agreed to follow-up contact."
          >
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.consentToContact}
                onChange={(event) =>
                  handleConsentChange(event.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span>
                Patient consents to follow-up contact
                <span className="mt-1 block text-xs text-slate-500">
                  You can update this if consent changes.
                </span>
              </span>
            </label>
            <Field
              label="Consent date"
              required={form.consentToContact}
              error={fieldErrors.consentDate}
            >
              <Input
                type="date"
                value={form.consentDate}
                onChange={(event) =>
                  updateField("consentDate", event.target.value)
                }
                aria-invalid={Boolean(fieldErrors.consentDate)}
                className={invalidClass("consentDate")}
              />
            </Field>
          </FormSection>
        </form>
      )}
    </Drawer>
  );
}
