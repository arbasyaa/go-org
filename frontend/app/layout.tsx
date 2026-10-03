import type { Metadata } from "next"
import {
  Inter,
  Lora,
  Manrope,
  Plus_Jakarta_Sans,
  Poppins,
  Public_Sans,
  Space_Grotesk,
} from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AppearanceSync } from "@/components/appearance-sync"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

// Semua font pilihan kustomisasi tampilan dimuat dengan variabel masing-masing;
// mapping ke --font-sans/--font-heading terjadi di globals.css + lib/appearance.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})
const poppins = Poppins({
  variable: "--font-poppins",
  preload: false,
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})
const manrope = Manrope({
  variable: "--font-manrope",
  preload: false,
  subsets: ["latin"],
  display: "swap",
})
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  preload: false,
  subsets: ["latin"],
  display: "swap",
})
// Pasangan font landing page (frontend/DESIGN.md): display & body.
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  preload: false,
  subsets: ["latin"],
  display: "swap",
})
const lora = Lora({
  variable: "--font-lora",
  preload: false,
  subsets: ["latin"],
  display: "swap",
})

const fontVariables = [
  inter.variable,
  poppins.variable,
  manrope.variable,
  spaceGrotesk.variable,
  jakarta.variable,
  lora.variable,
  publicSans.variable,
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
