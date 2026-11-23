import type { Metadata } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import { AppearanceSync } from "@/components/appearance-sync"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

// Semua font pilihan kustomisasi tampilan dimuat dengan variabel masing-masing;
// mapping ke --font-sans/--font-heading terjadi di globals.css + lib/appearance.
//
// File font di-host sendiri (fonts/*.woff2, subset latin) lewat next/font/local,
// BUKAN next/font/google: versi google mengunduh font saat `next build`, dan di
// container build tanpa akses ke fonts.googleapis.com seluruh build gagal
// ("module not found ... instrument_sans.module.css"). Dengan file lokal, build
// tidak butuh jaringan sama sekali.
const inter = localFont({
  src: "../fonts/inter.woff2",
  variable: "--font-inter",
  display: "swap",
})
const poppins = localFont({
  src: [
    { path: "../fonts/poppins-400.woff2", weight: "400" },
    { path: "../fonts/poppins-500.woff2", weight: "500" },
    { path: "../fonts/poppins-600.woff2", weight: "600" },
    { path: "../fonts/poppins-700.woff2", weight: "700" },
  ],
  variable: "--font-poppins",
  preload: false,
  display: "swap",
})
const manrope = localFont({
  src: "../fonts/manrope.woff2",
  variable: "--font-manrope",
  preload: false,
  display: "swap",
})
const spaceGrotesk = localFont({
  src: "../fonts/space-grotesk.woff2",
  variable: "--font-space-grotesk",
  preload: false,
  display: "swap",
})
const jakarta = localFont({
  src: "../fonts/jakarta.woff2",
  variable: "--font-jakarta",
  preload: false,
  display: "swap",
})
const lora = localFont({
  src: "../fonts/lora.woff2",
  variable: "--font-lora",
  preload: false,
  display: "swap",
})

const fontVariables = [
  inter.variable,
  poppins.variable,
  manrope.variable,
  spaceGrotesk.variable,
  jakarta.variable,
  lora.variable,
].join(" ")

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PERMIKOMNAS Jawa Tengah",
    template: "%s | PERMIKOMNAS Jawa Tengah",
  },
  description:
    "Perhimpunan Mahasiswa Informatika dan Komputer Nasional Wilayah VII Jawa Tengah — rumah bersama himpunan mahasiswa informatika dan komputer se-Jawa Tengah.",
  keywords: [
    "PERMIKOMNAS",
    "Jawa Tengah",
    "himpunan mahasiswa informatika",
    "organisasi mahasiswa teknologi",
    "Wilayah VII",
  ],
  applicationName: "PERMIKOMNAS Jawa Tengah",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "PERMIKOMNAS Jawa Tengah",
    title: "PERMIKOMNAS Jawa Tengah",
    description:
      "Perhimpunan Mahasiswa Informatika dan Komputer Nasional Wilayah VII Jawa Tengah — rumah bersama himpunan mahasiswa informatika dan komputer se-Jawa Tengah.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PERMIKOMNAS Jawa Tengah",
    description:
      "Perhimpunan Mahasiswa Informatika dan Komputer Nasional Wilayah VII Jawa Tengah — rumah bersama himpunan mahasiswa informatika dan komputer se-Jawa Tengah.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      /* Next.js memakai atribut ini untuk mematikan smooth scroll saat transisi
         route, supaya halaman baru tidak meluncur dari posisi scroll lama.
         Tanpa ini Next menulis peringatan di console setiap navigasi. */
      data-scroll-behavior="smooth"
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col">
        {/* Tampilan dikunci terang: dark mode dihapus (DESIGN.md §12). */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          forcedTheme="light"
        >
          <AppearanceSync />
          <TooltipProvider>
            <AuthProvider>{children}</AuthProvider>
            <Toaster richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
