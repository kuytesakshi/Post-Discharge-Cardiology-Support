import type { UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  patient: "Patient",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}
