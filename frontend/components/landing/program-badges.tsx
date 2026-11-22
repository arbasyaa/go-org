import type { WorkProgram } from "@/lib/landing/content"
import { categoryLabel, statusLabel } from "@/lib/landing/program"
import { cn } from "@/lib/utils"

const base =
  "inline-flex items-center rounded-full px-3 py-1 font-[family-name:var(--font-landing-label)] text-[0.66rem] font-semibold uppercase tracking-[0.12em]"

/** Badge kategori + status program. `tone` mengikuti latar (ink = gelap, paper = terang). */
export function ProgramBadges({
  category,
  status,
  tone = "ink",
  className,
}: {
  category: WorkProgram["category"]
  status: WorkProgram["status"]
  tone?: "ink" | "paper"
  className?: string
}) {
  const ink = tone === "ink"
  return (
    <span className={cn("flex flex-wrap items-center gap-2", className)}>
      <span
        className={cn(
          base,
          ink
            ? "border border-[var(--landing-on-ink)]/25 text-[var(--landing-on-ink)]"
            : "border border-[var(--landing-ink)]/25 text-[var(--landing-ink)]"
        )}
      >
        {categoryLabel(category)}
      </span>
      <span
        className={cn(
          base,
          status === "upcoming"
            ? "bg-[var(--landing-accent-deep)] text-white"
            : ink
              ? "bg-[var(--landing-on-ink)]/15 text-[var(--landing-on-ink)]"
              : "bg-[var(--landing-ink)]/10 text-[var(--landing-ink)]"
        )}
      >
        {statusLabel(status)}
      </span>
    </span>
  )
}
