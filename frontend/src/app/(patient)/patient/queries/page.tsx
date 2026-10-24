import type { Metadata } from "next";

import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = {
  title: "My queries",
};

export default function PatientQueriesPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Patient portal"
        title="My queries"
        description="Questions you have shared with your cardiology care team."
      />
      <EmptyState
        title="No questions yet"
        description="Once the question and answer flow is enabled, your non-urgent care questions and doctor responses will appear here."
      />
    </div>
  );
}
