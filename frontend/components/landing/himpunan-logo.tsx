"use client"

import { useState } from "react"

/**
 * Logo himpunan dengan fallback singkatan nama: dipakai bila himpunan belum
 * punya logo, atau bila gambar gagal dimuat (URL rusak, server sedang
 * restart) — tidak pernah menyisakan lingkaran kosong.
 */
export function HimpunanLogo({ src, name }: { src: string | null | undefined; name: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span aria-hidden className="font-[family-name:var(--font-landing-display)] text-xs font-extrabold text-[var(--landing-ink)]">
        {name.slice(0, 4)}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Logo ${name}`}
      loading="lazy"
      // Gambar SSR bisa gagal sebelum hidrasi (onError terlewat): cek saat mount.
      ref={(el) => {
        if (el && el.complete && el.naturalWidth === 0) setFailed(true)
      }}
      onError={() => setFailed(true)}
      className="size-full object-contain"
    />
  )
}
