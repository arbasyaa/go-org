import { MemberDirectory } from "@/components/landing/member-directory"
import { PageHero } from "@/components/landing/page-hero"
import { buildRegionCoordinators } from "@/lib/landing/content"
import { getHimpunan, getOfficials } from "@/lib/landing/fetch"

export const metadata = {
  title: "Daftar Anggota",
  description: "Daftar himpunan anggota PERMIKOMNAS Wilayah VII Jawa Tengah, dikelompokkan per daerah.",
}

export const revalidate = 60

/** /anggota: seluruh himpunan anggota aktif, per daerah, dengan pencarian klien. */
export default async function AnggotaPage() {
  const [members, officials] = await Promise.all([getHimpunan(), getOfficials()])

  return (
    <>
      <PageHero
        crumb="Anggota"
        eyebrow="Daftar anggota"
        title="Daftar anggota."
        lead="Himpunan mahasiswa informatika dan komputer yang tergabung dalam PERMIKOMNAS Wilayah VII Jawa Tengah."
      />
      <section aria-label="Daftar himpunan anggota" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          <MemberDirectory members={members} coordinators={buildRegionCoordinators(officials)} />
        </div>
      </section>
    </>
  )
}
