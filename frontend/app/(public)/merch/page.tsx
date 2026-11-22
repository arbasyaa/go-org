import { PageHero } from "@/components/landing/page-hero"
import { MerchCatalog } from "@/components/landing/merch-catalog"
import { getMerch } from "@/lib/landing/fetch"

export const metadata = {
  title: "Merch Resmi",
  description: "Katalog merchandise resmi PERMIKOMNAS Wilayah VII Jawa Tengah.",
}

export const revalidate = 60

/** /merch: katalog lengkap dengan filter kategori (client). */
export default async function MerchPage() {
  const items = await getMerch()

  return (
    <>
      <PageHero
        crumb="Merch"
        eyebrow="Merch resmi"
        title="Pakai identitasmu."
        lead="Koleksi resmi PERMIKOMNAS Jawa Tengah, dikelola divisi Kewirausahaan. Pemesanan langsung lewat tautan di tiap produk; hasil penjualan kembali ke program kerja wilayah."
      />
      <section aria-label="Katalog merch" className="bg-[var(--landing-paper)]">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
          <MerchCatalog items={items} />
        </div>
      </section>
    </>
  )
}
