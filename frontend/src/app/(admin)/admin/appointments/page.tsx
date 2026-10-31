import type { Metadata } from "next";

import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const metadata: Metadata = {
  title: "Appointments",
};

export default function AdminAppointmentsPage() {
  return (
    <AdminPlaceholder
      eyebrow="Care operations"
      title="Appointments"
      description="Coordinate follow-up visits and monitor today's schedule."
      emptyTitle="Scheduling workspace is coming soon"
      emptyDescription="The full calendar, rescheduling controls, and visit outcomes will appear here. A snapshot of today's visits is available on the dashboard."
    />
  );
}
