import type { Metadata } from "next";

import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Appointments",
};

export default function PatientAppointmentsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Patient portal"
        title="Appointments"
        description="Your upcoming and past cardiology follow-up visits."
      />
      <EmptyState
        title="No appointments yet"
        description="When appointment booking is enabled, you will be able to choose a cardiologist and schedule your follow-up here."
      />
    </div>
  );
}
