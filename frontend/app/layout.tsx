import type { Metadata } from "next"
import {
  Inter,
  Lora,
  Manrope,
  Plus_Jakarta_Sans,
  Poppins,
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
].join(" ")

export const metadata: Metadata = {
  title: "Permikomnas Jawa Tengah",
  description: "Sistem Informasi Manajemen Organisasi",
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
