"use client"

import { useState } from "react"
import { apiRequest } from "@/lib/api"
import { cn } from "@/lib/utils"

const VISITOR_KEY = "permikomnas.karya.visitor"

/** Id pengunjung untuk dedupe like. Dibuat sekali per browser, tidak pernah ditampilkan. */
function visitorID() {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
    return id
  } catch {
    // localStorage diblokir: pakai id sesi sementara, tetap tidak ditampilkan.
    return crypto.randomUUID()
  }
}

/**
 * Tombol like. Yang tampil hanya angka — tidak ada penanda "kamu sudah menyukai",
 * karena identitas pemberi like tidak untuk ditampilkan.
 */
export function KaryaLike({ code, initial }: { code: string; initial: number }) {
  const [count, setCount] = useState(initial)
  const [busy, setBusy] = useState(false)

  async function like() {
    if (busy) return
    setBusy(true)
    try {
      const result = await apiRequest<{ like_count: number }>(
        `/public/karya/${encodeURIComponent(code)}/like`,
        { method: "POST", body: { visitor_id: visitorID() } }
      )
      setCount(result.like_count)
    } catch {
      // Diam: kegagalan like bukan hal yang perlu mengganggu pembaca.
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={like}
      disabled={busy}
      aria-label={`Sukai karya ini, saat ini ${count} suka`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--landing-ink)]/20 px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] transition-colors duration-300",
        "hover:border-[var(--landing-ink)]/60 disabled:opacity-60"
      )}
    >
      <span aria-hidden className="text-[var(--landing-accent-deep)]">♥</span>
      <span className="tabular-nums">{count}</span>
      <span className="text-[var(--landing-ink-muted)]">suka</span>
    </button>
  )
}
