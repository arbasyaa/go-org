import { PageHero } from "@/components/landing/page-hero"
import { KaryaForm } from "@/components/landing/karya-form"

export const metadata = {
  title: "Kirim Karya",
  description: "Ajukan repositori karyamu untuk ditampilkan di showcase PERMIKOMNAS Jawa Tengah.",
}

export default function KaryaKirimPage() {
  return (
    <>
      <PageHero
        crumb="Kirim karya"
        eyebrow="Pengajuan showcase"
        title="Kirim karyamu."
        lead="Tanpa akun. Isi datanya, lampirkan satu foto, lalu simpan kode pelacakan yang muncul untuk mengecek status."
      />
      <section aria-label="Formulir pengajuan karya" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[820px] px-6 py-16 md:px-10 md:py-24">
          <KaryaForm />
        </div>
      </section>
    </>
  )
}
