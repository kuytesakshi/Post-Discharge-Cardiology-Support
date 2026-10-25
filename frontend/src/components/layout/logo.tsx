import { cn } from "@/lib/utils";

type LogoProps = {
  tone?: "dark" | "light";
};

export function Logo({ tone = "dark" }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl",
          tone === "light"
            ? "bg-white/10 text-emerald-200 ring-1 ring-white/15"
            : "bg-brand text-white shadow-[0_10px_30px_-12px_rgba(15,118,110,0.9)]",
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
          <path
            d="M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-ink",
        )}
      >
        CardioCare
      </span>
    </span>
  );
}
