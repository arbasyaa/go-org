"use client"

import Link from "next/link"
import { useSettings } from "@/hooks/use-settings"
import { DEFAULT_LOGO_URL, DEFAULT_SITE_NAME } from "@/lib/brand"
import { storageUrl } from "@/lib/storage-url"

export function SiteBrand({ size = "md" }: { size?: "sm" | "md" }) {
  const { settings } = useSettings()
  const name = settings?.web_name || DEFAULT_SITE_NAME
  const logoUrl = settings?.logo_url ? storageUrl(settings.logo_url) : DEFAULT_LOGO_URL

  return (
    <Link href="/" className="flex items-center gap-2 font-medium">
      <div
        className={`flex items-center justify-center overflow-hidden rounded-md bg-background ring-1 ring-border ${size === "sm" ? "size-6" : "size-8"}`}
      >
        <img src={logoUrl} alt={name} className="size-full object-contain" />
      </div>
      <span className={size === "sm" ? "text-sm" : "text-base"}>{name}</span>
    </Link>
  )
}
