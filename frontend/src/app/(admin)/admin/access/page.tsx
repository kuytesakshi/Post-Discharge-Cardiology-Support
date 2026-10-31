import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Access control",
};

export default function AdminAccessPage() {
  return (
    <AdminPlaceholder
      eyebrow="Administration"
      title="Access control"
      description="Manage administrator roles, permissions, and audit access."
      emptyTitle="Access control is not configured yet"
      emptyDescription="Role templates, least-privilege permissions, and audit trails will be managed from this workspace."
    />
  );
}
