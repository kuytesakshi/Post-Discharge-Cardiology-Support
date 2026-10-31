import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Queries",
};

export default function AdminQueriesPage() {
  return (
    <AdminPlaceholder
      eyebrow="Care operations"
      title="Patient queries"
      description="Triage incoming questions and route them to the right clinician."
      emptyTitle="Query triage is being built"
      emptyDescription="Unread patient messages, routing rules, and response SLAs will be managed here. Urgent items are surfaced on the dashboard."
    />
  );
}
