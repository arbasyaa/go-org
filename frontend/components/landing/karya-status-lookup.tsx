"use client"

import { useState } from "react"
import Link from "next/link"
import { apiRequest } from "@/lib/api"

type Status = {
  code: string
  title: string
  status: "review" | "published" | "rejected"
  review_note?: string
  created_at: string
  published_at?: string | null
}

const LABEL: Record<Status["status"], { text: string; note: string }> = {
  review: { text: "Sedang ditinjau", note: "Pengurus belum memutuskan. Karya belum tayang." },
  published: { text: "Sudah tayang", note: "Karyamu bisa dilihat di katalog." },
  rejected: { text: "Tidak diloloskan", note: "Karya tidak ditayangkan. Kamu bisa mengirim karya lain." },
}

export function KaryaStatusLookup() {
  const [code, setCode] = useState("")
  const [result, setResult] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const data = await apiRequest<Status>(`/public/karya_status/${encodeURIComponent(code.trim())}`)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kode tidak ditemukan")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form onSubmit={lookup} className="flex flex-wrap gap-3">
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="KRY-XXXXXX"
          aria-label="Kode pelacakan karya"
          className="min-w-0 flex-1 rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/20 bg-[var(--landing-paper-raised)] px-4 py-3 font-mono text-sm uppercase tracking-[0.08em] text-[var(--landing-ink)] outline-none focus:border-[var(--landing-ink)]/60"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-[var(--landing-ink)] px-6 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] disabled:opacity-60"
        >
          {busy ? "Mencari…" : "Cek status"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-6 rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/20 px-4 py-3 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)]">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-8 rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/15 bg-[var(--landing-paper-raised)] p-6">
          <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-deep)]">
            {LABEL[result.status].text}
          </p>
          <p className="mt-3 font-[family-name:var(--font-landing-display)] text-2xl font-extrabold text-[var(--landing-ink)]">
            {result.title}
          </p>
          <p className="mt-1 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink-muted)]">
            {LABEL[result.status].note}
          </p>
          {result.review_note ? (
            <p className="mt-4 border-l-2 border-[var(--landing-accent)] pl-3 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)]">
              Catatan pengurus: {result.review_note}
            </p>
          ) : null}
          {result.status === "published" ? (
            <Link
              href={`/karya/${result.code}`}
              className="mt-5 inline-flex rounded-full bg-[var(--landing-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline"
            >
              Lihat karyanya
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
