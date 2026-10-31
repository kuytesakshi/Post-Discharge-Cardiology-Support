import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Patients",
};

export default function AdminPatientsPage() {
  return (
    <AdminPlaceholder
      eyebrow="Care operations"
      title="Patient directory"
      description="Search, segment, and manage every patient in the post-discharge program."
      emptyTitle="Patient directory is being prepared"
      emptyDescription="This workspace will host the full patient roster, risk segmentation, and enrollment tools. Dashboard metrics are already live."
    />
  );
}
