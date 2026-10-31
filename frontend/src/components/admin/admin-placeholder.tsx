import Link from "next/link";

import { PageHeading } from "@/components/layout/page-heading";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type AdminPlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
};

export function AdminPlaceholder({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: AdminPlaceholderProps) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link
            href="/admin/dashboard"
            className={buttonClasses("outline", "sm")}
          >
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
