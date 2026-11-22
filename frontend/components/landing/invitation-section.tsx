import { invitationSteps } from "@/lib/landing/content"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"
import { MagneticLink } from "@/components/landing/magnetic-link"

/**
 * Ajakan mengundang: alur tiga langkah yang sama persis dengan halaman
 * /undangan (sumber teks: invitationSteps). Kiri judul + CTA menempel
 * (sticky), kanan langkah-langkah bernomor raksasa yang masuk bergiliran.
 */
export function InvitationSection() {
  return (
    <section
      id="undangan"
      aria-labelledby="undangan-title"
      className="relative scroll-mt-24 overflow-clip bg-[var(--landing-accent-deep)] text-white"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,color-mix(in_oklab,var(--landing-ink)_55%,transparent),transparent_70%)]"
      />
      <div aria-hidden className="landing-grain pointer-events-none absolute inset-0 opacity-[0.15]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-14 px-6 py-28 md:px-10 md:py-40 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionLabel index="07" tone="red">
              Undangan kegiatan
            </SectionLabel>
            <SectionTitle id="undangan-title" text="Undang kami ke acaramu." className="mt-6 max-w-[10ch] text-white" />
            <p data-reveal className="mt-8 max-w-[42ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-white/90 md:text-lg">
              Seminar, kompetisi, musyawarah, atau pelantikan himpunan — kirim surat undangan resmi lewat formulir daring. Tanpa akun, langsung ke sekretariat.
            </p>
            <div data-reveal className="mt-10">
              <MagneticLink href="/undangan" variant="solid-paper" cursor="Kirim">
                Kirim undangan
              </MagneticLink>
            </div>
          </div>
        </div>

        <ol data-stagger className="space-y-4 lg:col-span-6 lg:col-start-7">
          {invitationSteps.map((step, i) => (
            <li
              key={step.title}
              className="group relative grid grid-cols-[auto_1fr] gap-6 overflow-hidden rounded-[var(--landing-radius-md)] border border-white/20 bg-white/[0.06] p-6 backdrop-blur-sm transition-[background-color,border-color] duration-500 hover:border-white/50 hover:bg-white/[0.12] md:p-8"
            >
              <span
                aria-hidden
                className="font-[family-name:var(--font-landing-display)] text-6xl font-extrabold leading-none tabular-nums text-white/90 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-6 group-hover:scale-110 md:text-7xl"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-landing-display)] text-2xl font-bold">{step.title}</h3>
                <p className="mt-2 font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-white/90 md:text-base">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
