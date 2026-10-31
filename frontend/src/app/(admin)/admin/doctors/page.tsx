import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Doctors",
};

export default function AdminDoctorsPage() {
  return (
    <AdminPlaceholder
      eyebrow="Care operations"
      title="Care team"
      description="Invite cardiologists, manage availability, and review caseloads."
      emptyTitle="Care team management is on the way"
      emptyDescription="Doctor invitations, availability windows, and caseload balancing will live here. Today's availability is visible on the dashboard."
    />
  );
}
