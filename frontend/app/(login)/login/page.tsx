import { Suspense } from "react"
import Image from "next/image"
import { LayersIcon, ShieldCheckIcon, UsersIcon } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Skeleton } from "@/components/ui/skeleton"
import { DEFAULT_LOGO_URL } from "@/lib/brand"

const HIGHLIGHTS = [
  { icon: UsersIcon, label: "Pengurus & divisi" },
  { icon: LayersIcon, label: "Event, absensi & surat" },
  { icon: ShieldCheckIcon, label: "Akses sesuai peran" },
]

function LoginFormFallback() {
  return <Skeleton className="h-96 w-full rounded-2xl" />
}

/**
 * Halaman masuk: dua kolom di lg ke atas (panel identitas + kartu form),
 * satu kolom di layar sempit dengan logo di atas form. Route group `(login)`
 * sengaja terpisah dari `(auth)` agar tidak ikut layout panel lama.
 */
export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="auth-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-foreground/5 to-transparent"
        />
        <div
          aria-hidden
          className="absolute -top-32 -right-32 size-[28rem] rounded-full border border-primary-foreground/15"
        />
        <div
          aria-hidden
          className="absolute -top-16 -right-16 size-[18rem] rounded-full border border-primary-foreground/15 bg-primary-foreground/5"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-40 size-[26rem] rounded-full bg-primary-foreground/5"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-background p-1 shadow-lg">
            <Image
              src={DEFAULT_LOGO_URL}
              alt="Logo PERMIKOMNAS Jawa Tengah"
              width={64}
              height={64}
              priority
              className="size-full object-contain"
            />
          </div>
          <p className="font-heading text-lg font-semibold tracking-tight">
            PERMIKOMNAS Jawa Tengah
          </p>
        </div>

        <div className="relative max-w-md space-y-5">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-foreground/80">
            Portal Pengurus
          </p>
          <h2 className="font-heading text-4xl leading-tight font-semibold tracking-tight text-balance">
            Satu tempat untuk mengelola kegiatan organisasi.
          </h2>
          <p className="text-primary-foreground/85">
            Portal internal Badan Pengurus Wilayah untuk jadwal event, absensi,
            perizinan, pengumuman, dan surat.
          </p>
          <ul className="flex flex-col gap-2.5 pt-2 text-sm">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Icon className="size-3.5" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/70">
          Perhimpunan Mahasiswa Informatika dan Komputer Nasional · Wilayah VII
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center gap-6 bg-muted/30 p-6 sm:p-10">
        <div className="flex flex-col items-center gap-3 text-center lg:hidden">
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-background p-1 shadow-sm ring-1 ring-border">
            <Image
              src={DEFAULT_LOGO_URL}
              alt="Logo PERMIKOMNAS Jawa Tengah"
              width={80}
              height={80}
              priority
              className="size-full object-contain"
            />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">
              PERMIKOMNAS Jawa Tengah
            </p>
            <p className="text-sm text-muted-foreground">Portal Pengurus</p>
          </div>
        </div>
        <div className="w-full max-w-sm">
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
