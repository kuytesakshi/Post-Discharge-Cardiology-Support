import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholder
      eyebrow="Administration"
      title="Program settings"
      description="Configure follow-up cadence, notification rules, and integrations."
      emptyTitle="Program settings are coming soon"
      emptyDescription="Follow-up schedules, alert thresholds, and integration credentials will be configurable here."
    />
  );
}
