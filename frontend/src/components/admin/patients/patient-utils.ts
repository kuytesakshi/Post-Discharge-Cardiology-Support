import type { AdminPatientListItem, RiskLevel } from "@/types/admin";

type BadgeTone = "teal" | "slate" | "amber" | "green" | "red";

export const riskTone: Record<RiskLevel, BadgeTone> = {
  low: "green",
  moderate: "amber",
  high: "red",
};

export const riskLabel: Record<RiskLevel, string> = {
  low: "Low risk",
  moderate: "Moderate",
  high: "High risk",
};

export function profileStatusTone(status: string): BadgeTone {
  switch (status.toLowerCase()) {
    case "active":
      return "green";
    case "discharged":
      return "teal";
    case "inactive":
      return "slate";
    default:
      return "slate";
  }
}

export function profileStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "Active";
    case "discharged":
      return "Discharged";
    case "inactive":
      return "Inactive";
    default:
      return status
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "PT";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function isFollowUpOverdue(patient: AdminPatientListItem): boolean {
  return patient.nextFollowUp.toLowerCase().startsWith("overdue");
}

export function displayGender(gender: string | null | undefined): string {
  if (!gender) {
    return "Not recorded";
  }

  return gender.charAt(0).toUpperCase() + gender.slice(1);
}
