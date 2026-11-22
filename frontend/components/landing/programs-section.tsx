import type { WorkProgram } from "@/lib/landing/content"
import { SectionLabel, SectionTitle } from "@/components/landing/kinetic"

const NUMBER_WORDS = ["Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh"]

const tones = [
  "from-[var(--landing-accent)]/35",
  "from-[var(--landing-cyan)]/35",
  "from-[var(--landing-green)]/35",
  "from-[var(--landing-accent)]/25",
  "from-[var(--landing-cyan)]/25",
]

/**
 * Program kerja: di layar lebar section dipin dan scroll vertikal diubah
 * menjadi geseran horizontal (landing-motion §9) — program dibaca
 * sebagai satu perjalanan. Di bawah 1024px kembali ke tumpukan vertikal biasa
 * (tidak ada scroll horizontal tersembunyi di ponsel).
 */
export function ProgramsSection({ programs }: { programs: readonly WorkProgram[] }) {
  // Wrapper <div> milik React: ScrollTrigger `pin` membungkus <section> dengan
  // div.pin-spacer. Tanpa wrapper, saat navigasi ke route lain React mencoba
  // removeChild(<section>) dari <main> padahal parent-nya sudah pin-spacer
  // (cleanup gsap baru jalan setelah commit DOM) → NotFoundError removeChild.
  return (
    <div>
    <section
      id="program"
      data-hscroll
      aria-labelledby="program-title"
      className="relative scroll-mt-24 overflow-hidden bg-[var(--landing-ink)] text-[var(--landing-on-ink)] lg:h-[100svh]"
    >
      <div aria-hidden className="landing-grain pointer-events-none absolute inset-0 opacity-[0.1]" />
      <div
        data-hscroll-track
        className="relative flex flex-col gap-6 px-6 py-28 md:px-10 lg:h-full lg:w-max lg:flex-row lg:items-center lg:gap-8 lg:py-0 lg:pl-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))] lg:pr-[12vw]"
      >
        <div className="flex shrink-0 flex-col justify-center lg:w-[38vw] lg:pr-10">
          <SectionLabel index="02">Program kerja</SectionLabel>
          <SectionTitle id="program-title" text={programs.length === 1 ? "Satu agenda, satu wilayah." : `${NUMBER_WORDS[programs.length] ?? programs.length} agenda, satu wilayah.`} className="mt-6 max-w-[11ch]" accentLast />
          <p data-reveal className="mt-8 max-w-[40ch] font-[family-name:var(--font-landing-body)] text-base leading-relaxed text-[var(--landing-on-ink-dim)] md:text-lg">
            Agenda rutin yang menautkan seluruh himpunan anggota dalam satu kalender kegiatan wilayah.
          </p>
          <p aria-hidden className="mt-10 hidden items-center gap-3 font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-on-ink-dim)] lg:flex">
            Gulir untuk menjelajah
            <span className="inline-block animate-[landing-nudge_1.6s_ease-in-out_infinite] motion-reduce:animate-none">→</span>
          </p>
        </div>

        <ol className="contents">
          {programs.map((program, i) => (
            <li
              key={program.name}
              data-hscroll-card
              data-reveal
              data-cursor="Program"
              className="group relative flex min-h-[22rem] shrink-0 flex-col overflow-hidden rounded-[var(--landing-radius-md)] border border-[var(--landing-on-ink)]/12 bg-[var(--landing-ink-deep)] p-6 transition-[border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:border-[var(--landing-on-ink)]/35 md:p-8 lg:h-[68svh] lg:w-[min(30rem,34vw)]"
            >
              <div
                aria-hidden
                className={`absolute inset-0 -z-0 bg-gradient-to-br ${tones[i % tones.length]} to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-100`}
              />
              <Orbit index={i} />
              <div className="relative flex items-start justify-between gap-4">
                <span className="font-[family-name:var(--font-landing-display)] text-6xl font-extrabold leading-none tabular-nums text-[var(--landing-on-ink)]/90 md:text-7xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="rounded-full border border-[var(--landing-on-ink)]/25 bg-[var(--landing-ink-deep)]/60 px-3.5 py-1.5 font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-on-ink)]">
                  {program.cadence}
                </span>
              </div>
              <div className="relative mt-auto pt-16">
                <h3 className="font-[family-name:var(--font-landing-display)] text-2xl font-bold leading-tight md:text-3xl">
                  {program.name}
                </h3>
                <p className="mt-3 max-w-[40ch] font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-on-ink-dim)] md:text-base">
                  {program.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
    </div>
  )
}

/** Orbit dekoratif — mengutip cincin yang mengelilingi bola dunia di logo. */
function Orbit({ index }: { index: number }) {
  const rotate = -18 + index * 14
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      className="pointer-events-none absolute -right-10 top-10 size-56 opacity-50 transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[24deg] group-hover:scale-110 md:size-64"
    >
      <circle cx="100" cy="100" r="46" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <ellipse
        cx="100"
        cy="100"
        rx="92"
        ry="30"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.6"
        transform={`rotate(${rotate} 100 100)`}
      />
      <circle cx="100" cy="100" r="3" fill="var(--landing-accent)" />
      <circle
        cx={100 + 92 * Math.cos((rotate * Math.PI) / 180)}
        cy={100 + 92 * Math.sin((rotate * Math.PI) / 180)}
        r="4"
        fill="var(--landing-cyan)"
      />
    </svg>
  )
}
