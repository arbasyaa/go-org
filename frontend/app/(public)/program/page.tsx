import { PageHero } from "@/components/landing/page-hero"
import { ProgramCatalog } from "@/components/landing/program-catalog"
import { getWorkPrograms } from "@/lib/landing/fetch"

export const metadata = {
  title: "Program Kerja & Agenda",
  description: "Program kerja dan agenda kegiatan PERMIKOMNAS Wilayah VII Jawa Tengah.",
}

// Konten dikelola lewat admin: halaman ini dirender per request supaya
// perubahan (pengurus, program, berita, merch) langsung terlihat, tanpa
// menunggu revalidate dan tanpa perlu redeploy.
export const dynamic = "force-dynamic"

/** /program: seluruh program kerja & agenda aktif, filter status/kategori di klien. */
export default async function ProgramIndexPage() {
  const { items } = await getWorkPrograms()

  return (
    <>
      <PageHero
        crumb="Program"
        eyebrow="Program kerja & agenda"
        title="Program kerja & agenda."
        lead="Kalender kegiatan yang menautkan seluruh himpunan anggota PERMIKOMNAS Jawa Tengah dalam satu wilayah."
      />
      <section aria-label="Daftar program kerja dan agenda" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          <ProgramCatalog items={items} />
        </div>
      </section>
    </>
  )
}
