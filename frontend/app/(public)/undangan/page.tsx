import { InvitationForm } from "@/components/invitation-form"
import { PageHero } from "@/components/landing/page-hero"
import { invitationSteps, org } from "@/lib/landing/content"

export const metadata = {
  title: "Kirim Undangan",
  description:
    "Undang PERMIKOMNAS Jawa Tengah ke acara himpunan atau instansimu. Isi formulir dan unggah surat undangan PDF — tanpa akun.",
  robots: { index: false, follow: false },
}

/**
 * /undangan: hero ringkas, lalu grid 5/7 — kiri alur + ketentuan (sticky),
 * kanan formulir. Alur memakai sumber teks yang sama dengan section landing.
 */
export default function PublicInvitationPage() {
  return (
    <>
      <PageHero
        crumb="Undangan"
        eyebrow="Undangan kegiatan"
        title="Undang kami ke acaramu."
        lead="Formulir ini untuk himpunan atau instansi yang ingin mengundang PERMIKOMNAS Jawa Tengah. Tidak perlu membuat akun — surat langsung masuk ke kotak sekretariat."
      />

      <section aria-label="Formulir undangan" className="relative bg-[var(--landing-paper)]">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-5">
            <div className="space-y-10 lg:sticky lg:top-28">
              <div>
                <h2 data-reveal className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--landing-ink-muted)]">
                  Alurnya
                </h2>
                <ol data-stagger className="mt-6 space-y-6">
                  {invitationSteps.map((step, i) => (
                    <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--landing-ink)]/12 pb-6">
                      <span aria-hidden className="font-[family-name:var(--font-landing-display)] text-4xl font-extrabold leading-none text-[var(--landing-accent-deep)]">
                        {i + 1}
                      </span>
                      <div>
                        <h3 className="font-[family-name:var(--font-landing-display)] text-xl font-bold text-[var(--landing-ink)]">{step.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-[var(--landing-ink-muted)]">{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div data-reveal className="rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] p-6 text-[var(--landing-on-ink)]">
                <h2 className="font-[family-name:var(--font-landing-display)] text-lg font-bold">Ketentuan singkat</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--landing-on-ink-dim)]">
                  <li>• Surat berformat PDF, maksimal 5 MB.</li>
                  <li>• Kirim paling lambat 7 hari sebelum acara agar delegasi bisa ditugaskan.</li>
                  <li>
                    • Pertanyaan? Hubungi{" "}
                    <a href={`mailto:${org.email}`} className="text-[var(--landing-on-ink)] underline underline-offset-4">
                      {org.email}
                    </a>
                    .
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          <div data-reveal className="lg:col-span-7">
            <InvitationForm />
          </div>
        </div>
      </section>
    </>
  )
}
