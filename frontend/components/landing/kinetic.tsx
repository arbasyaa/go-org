import { cn } from "@/lib/utils"

/**
 * Memecah teks per kata, masing-masing di dalam "jendela" overflow-hidden,
 * supaya landing-motion bisa menaikkan tiap kata dari balik tirai (mask
 * reveal) dengan stagger. Teks utuh tetap ada untuk pembaca layar lewat
 * `aria-label` di elemen induk; potongan kata di-aria-hidden.
 */
export function SplitWords({
  text,
  accentLast = false,
  attr = "data-word",
}: {
  text: string
  accentLast?: boolean
  attr?: string
}) {
  const words = text.split(" ")
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="inline-block overflow-hidden pb-[0.08em] align-bottom"
          >
            <span
              {...{ [attr]: "" }}
              className={cn(
                "inline-block will-change-transform",
                accentLast && i === words.length - 1 && "text-[var(--landing-accent)]"
              )}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </span>
          </span>
        ))}
      </span>
    </>
  )
}

/** Label kecil di atas judul section: nomor + nama, gaya indeks editorial. */
export function SectionLabel({
  index,
  children,
  tone = "ink",
}: {
  index: string
  children: React.ReactNode
  tone?: "ink" | "paper" | "red"
}) {
  return (
    <p
      data-reveal
      className={cn(
        "flex items-center gap-3 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em]",
        tone === "ink" && "text-[var(--landing-on-ink-dim)]",
        tone === "paper" && "text-[var(--landing-ink-muted)]",
        tone === "red" && "text-white"
      )}
    >
      <span className={cn("tabular-nums", tone === "red" ? "text-white" : tone === "paper" ? "text-[var(--landing-accent-deep)]" : "text-[var(--landing-accent)]")}>
        {index}
      </span>
      <span
        aria-hidden
        className={cn(
          "h-px w-8",
          tone === "paper" ? "bg-[var(--landing-ink)]/25" : "bg-white/30"
        )}
      />
      {children}
    </p>
  )
}

/** Judul section dengan mask reveal per kata. */
export function SectionTitle({
  id,
  text,
  className,
  accentLast,
}: {
  id: string
  text: string
  className?: string
  accentLast?: boolean
}) {
  return (
    <h2
      id={id}
      data-split
      className={cn(
        "font-[family-name:var(--font-landing-display)] text-[clamp(2.5rem,6.5vw,5.75rem)] font-extrabold leading-[0.92] tracking-[-0.035em]",
        className
      )}
    >
      <SplitWords text={text} accentLast={accentLast} />
    </h2>
  )
}
