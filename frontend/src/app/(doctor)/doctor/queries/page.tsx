import type { Metadata } from "next";

import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "Patient queries",
};

export default function DoctorQueriesPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Doctor portal"
        title="Patient queries"
        description="Non-urgent questions from patients recovering after discharge."
      />
      <EmptyState
        title="No patient questions yet"
        description="Once the question and answer flow is enabled, new patient questions will appear here for review and response."
      />
    </div>
  );
}
