import Link from "next/link"
import { PageHero } from "@/components/landing/page-hero"

export const metadata = {
  title: "Syarat & Ketentuan Karya",
  description: "Ketentuan pengajuan karya untuk showcase PERMIKOMNAS Wilayah VII Jawa Tengah.",
}

/**
 * Satu-satunya sumber teks S&K. Halaman /karya/kirim menautkan ke sini, dan
 * versi teksnya dicatat di setiap kiriman (services.KaryaTermsVersion) —
 * naikkan KARYA_TERMS_VERSION setiap daftar ini berubah.
 */
const KARYA_TERMS_VERSION = "2026-11-23"

const TERMS: { title: string; body: string }[] = [
  {
    title: "Karya sendiri",
    body: "Yang diajukan adalah karya sendiri, atau karya yang kamu punya hak untuk mempublikasikannya. Bukan salinan tanpa perubahan berarti.",
  },
  {
    title: "Repositori terbuka",
    body: "Repositori bersifat publik dan bisa dibuka tanpa login, tanpa perlu meminta akses.",
  },
  {
    title: "Tanpa rahasia",
    body: "Repositori tidak memuat kredensial, API key, token, atau data pribadi orang lain.",
  },
  {
    title: "Tanpa konten berbahaya",
    body: "Tidak memuat konten yang melanggar hukum, menyerang pihak lain, atau berisi malware dan alat untuk merusak sistem.",
  },
  {
    title: "Lisensi dihormati",
    body: "Pustaka, aset, dan kode pihak ketiga dipakai sesuai lisensinya dan disebutkan sebagaimana mestinya.",
  },
  {
    title: "Jujur menggambarkan",
    body: "Judul, penjelasan, dan gambar mewakili karya secara jujur — bukan proyek lain yang diklaim sebagai milikmu.",
  },
  {
    title: "Gambar yang sah",
    body: "Gambar yang diunggah milikmu atau berlisensi bebas, dan tidak menampilkan orang lain tanpa izin.",
  },
  {
    title: "Dikurasi pengurus",
    body: "Kiriman ditinjau pengurus sebelum tayang. Pengurus dapat menolak atau menurunkan karya yang tidak memenuhi ketentuan ini, dengan atau tanpa pemberitahuan rinci.",
  },
  {
    title: "Satu karya satu pengajuan",
    body: "Kiriman ganda atau spam ditolak. Kiriman yang ditolak tidak dapat diperbaiki; ajukan karya sebagai kiriman baru.",
  },
  {
    title: "Hak cipta tetap milikmu",
    body: "Permikomnas tidak mengklaim hak cipta atas karya. Yang ditampilkan adalah tautan dan ringkasan, dan karya akan dihapus dari showcase bila pemiliknya meminta.",
  },
]

export default function KaryaSnkPage() {
  return (
    <>
      <PageHero
        crumb="Syarat & Ketentuan"
        eyebrow="Pengajuan karya"
        title="Syarat & ketentuan."
        lead="Aturan umum sebelum mengirimkan repositori ke showcase PERMIKOMNAS Jawa Tengah."
      />
      <section aria-label="Isi syarat dan ketentuan" className="bg-[var(--landing-paper)] text-[var(--landing-ink)]">
        <div className="mx-auto max-w-[820px] px-6 py-16 md:px-10 md:py-24">
          <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
            Versi {KARYA_TERMS_VERSION}
          </p>
          <ol className="mt-8 grid gap-6">
            {TERMS.map((t, i) => (
              <li key={t.title} className="grid grid-cols-[auto_1fr] gap-4 border-b border-[var(--landing-ink)]/12 pb-6 last:border-0">
                <span className="font-[family-name:var(--font-landing-display)] text-2xl font-extrabold tabular-nums text-[var(--landing-accent-deep)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-[family-name:var(--font-landing-display)] text-lg font-bold leading-tight">
                    {t.title}
                  </h2>
                  <p className="mt-2 font-[family-name:var(--font-landing-body)] text-[0.95rem] leading-relaxed text-[var(--landing-ink-muted)]">
                    {t.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink-muted)]">
            Dengan mengirim karya, kamu menyatakan telah membaca dan menyetujui ketentuan di atas.
            Pertanyaan lain bisa dikirim ke{" "}
            <Link href="/#kontak" className="font-semibold text-[var(--landing-ink)] underline underline-offset-4">
              kontak pengurus
            </Link>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/karya/kirim"
              className="rounded-full bg-[var(--landing-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline"
            >
              Setuju, kirim karya
            </Link>
            <Link
              href="/karya"
              className="rounded-full border border-[var(--landing-ink)]/25 px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline"
            >
              Lihat katalog
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}