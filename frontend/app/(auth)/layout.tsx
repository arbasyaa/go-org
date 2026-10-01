"use client"

import Image from "next/image"
import { SiteBrand } from "@/components/site-brand"
import { DEFAULT_SITE_NAME } from "@/lib/brand"

/**
 * Panel kanan halaman auth: logo resmi (varian teks putih, latar transparan)
 * di atas warna aksen, bukan foto. Varian putih dipakai karena latarnya gelap.
 */
const PANEL_LOGO = "/assets/logo-white-text.png"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <SiteBrand size="sm" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      {/* Aksen + bidang beraturan, bukan biru rata: teksturnya memberi kedalaman
          tanpa gambar, dan pita bawah menggelapkan area teks. */}
      <div className="relative hidden overflow-hidden bg-primary lg:block">
        <div aria-hidden className="auth-grid absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-foreground/45 via-foreground/10 to-transparent"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12 pb-40">
          <Image
            src={PANEL_LOGO}
            alt={`Logo ${DEFAULT_SITE_NAME}`}
            width={520}
            height={550}
            priority
            // Logo dirender paling lebar 448px (max-w-md) dan panelnya hanya
            // tampil di lg ke atas, jadi jangan minta gambar 50vw (3840px).
            sizes="448px"
            className="h-auto w-full max-w-md object-contain drop-shadow-lg"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-center p-12">
          <div className="max-w-md space-y-3 text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance text-white">
              Sistem Informasi Permikomnas Jateng
            </h2>
            <p className="text-white/80">
              Event, kalender, perizinan, pengumuman, dan surat dalam satu
              platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
