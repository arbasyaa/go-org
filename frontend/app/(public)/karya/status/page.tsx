import { PageHero } from "@/components/landing/page-hero"
import { KaryaStatusLookup } from "@/components/landing/karya-status-lookup"

export const metadata = {
  title: "Status Kiriman Karya",
  description: "Cek status pengajuan karya dengan kode pelacakan.",
}

export default function KaryaStatusPage() {
  return (
    <>
      <PageHero
        crumb="Status karya"
        eyebrow="Pelacakan kiriman"
        title="Cek status kiriman."
        lead="Masukkan kode yang kamu terima saat mengirim karya. Tidak perlu akun."
      />
      <section aria-label="Pencarian status karya" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[720px] px-6 py-16 md:px-10 md:py-24">
          <KaryaStatusLookup />
        </div>
      </section>
    </>
  )
}
