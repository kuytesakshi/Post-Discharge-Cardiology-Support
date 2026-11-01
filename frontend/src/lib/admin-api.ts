import { apiFetch } from "@/lib/api";
import type {
  AdminDashboardData,
  AdminDoctorOption,
  AdminPatientCreatePayload,
  AdminPatientDetail,
  AdminPatientListResponse,
  AdminPatientReadResponse,
  AdminPatientUpdatePayload,
} from "@/types/admin";

export interface AdminPatientListParams {
  search?: string;
  status?: string;
  risk?: string;
  doctorId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export function getAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>("/admin/dashboard");
}

export function getAdminPatients(
  params: AdminPatientListParams = {},
): Promise<AdminPatientListResponse> {
  const query = new URLSearchParams();
  const values: Record<string, string | number | undefined> = {
    search: params.search,
    status: params.status,
    risk: params.risk,
    doctor_id: params.doctorId,
    page: params.page,
    page_size: params.pageSize,
    sort: params.sort,
  };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }

  const suffix = query.toString();
  return apiFetch<AdminPatientListResponse>(
    `/admin/patients${suffix ? `?${suffix}` : ""}`,
  );
}

export function getAdminPatient(
  patientId: string,
): Promise<AdminPatientDetail> {
  return apiFetch<AdminPatientDetail>(`/admin/patients/${patientId}`);
}

export function createAdminPatient(
  payload: AdminPatientCreatePayload,
): Promise<AdminPatientReadResponse> {
  return apiFetch<AdminPatientReadResponse>("/admin/patients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminPatient(
  patientId: string,
  payload: AdminPatientUpdatePayload,
): Promise<AdminPatientDetail> {
  return apiFetch<AdminPatientDetail>(`/admin/patients/${patientId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAdminDoctorOptions(): Promise<AdminDoctorOption[]> {
  return apiFetch<AdminDoctorOption[]>("/admin/doctors/options");
}
