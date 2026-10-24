import type { Metadata } from "next";

import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Appointments",
};

export default function DoctorAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Doctor portal"
        title="Appointments"
        description="Follow-up visits booked by your post-discharge patients."
      />
      <EmptyState
        title="No appointments yet"
        description="When patients book follow-up visits, their appointments and details will appear here."
      />
    </div>
  );
}
