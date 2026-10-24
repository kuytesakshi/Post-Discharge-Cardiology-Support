import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "teal" | "slate" | "amber" | "green" | "red";

const toneClasses: Record<BadgeTone, string> = {
  teal: "bg-teal-50 text-teal-700 ring-teal-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
