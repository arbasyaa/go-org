import { recruitmentCta } from "@/lib/landing/content"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import { MagneticLink } from "@/components/landing/magnetic-link"

/**
 * CTA keanggotaan: satu ajakan selebar layar di atas indigo, angka wilayah
 * "VII" raksasa sebagai lapisan parallax di belakang.
 */
export function CtaSection() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden bg-[var(--landing-ink)] text-[var(--landing-on-ink)]"
    >
      <div aria-hidden className="landing-grid absolute inset-0 opacity-40" />
      <span
        aria-hidden
        data-parallax="0.3"
        className="landing-outline pointer-events-none absolute -right-[4vw] top-1/2 -z-0 -translate-y-1/2 select-none font-[family-name:var(--font-landing-display)] text-[clamp(14rem,38vw,34rem)] font-extrabold leading-none tracking-[-0.05em]"
      >
        VII
      </span>

      <div className="relative mx-auto max-w-[1400px] px-6 py-28 md:px-10 md:py-40">
        <div className="max-w-[56ch]">
          <SectionLabel index="08">Keanggotaan</SectionLabel>
          <SectionTitle id="cta-title" text={recruitmentCta.title} className="mt-6 max-w-[13ch]" accentLast />
          <p data-reveal className="mt-8 font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-on-ink-dim)] md:text-lg">
            {recruitmentCta.body}
          </p>
          <div data-reveal className="mt-10 flex flex-wrap items-center gap-3">
            <MagneticLink href={recruitmentCta.primary.href} variant="accent" cursor="Email">
              {recruitmentCta.primary.label}
            </MagneticLink>
            <MagneticLink href={recruitmentCta.secondary.href} variant="ghost-ink" arrow={false}>
              {recruitmentCta.secondary.label}
            </MagneticLink>
          </div>
        </div>
      </div>
    </section>
  )
}
