import { apiFetch } from "@/lib/api";
import type { AdminDashboardData } from "@/types/admin";

export function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>("/admin/dashboard");
}
