import type { Metadata } from "next";

import { PatientMaster } from "@/components/admin/patients/patient-master";

export const metadata: Metadata = {
  title: "Patient Master",
};

export default function AdminPatientsPage() {
  return <PatientMaster />;
}
