"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { apiRequest } from "@/lib/api"
import { fetchHimpunanOptions } from "@/lib/himpunan"
import type { HimpunanOption } from "@/lib/public-content"

const MIN_ABOUT = 50
const MAX_ABOUT = 20000

type Result = { code: string }

/**
 * Form pengajuan karya. Pratinjau markdown memakai endpoint yang sama dengan
 * halaman detail, jadi yang dilihat pengirim identik dengan hasil akhir.
 */
export function KaryaForm() {
  const [himpunan, setHimpunan] = useState<HimpunanOption[]>([])
  const [form, setForm] = useState({
    title: "",
    author_name: "",
    himpunan_id: "",
    repo_url: "",
    about_md: "",
    website: "", // honeypot
  })
  const [image, setImage] = useState<File | null>(null)
  const [terms, setTerms] = useState(false)
  const [preview, setPreview] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchHimpunanOptions().then(setHimpunan).catch(() => setHimpunan([]))
  }, [])

  // Pratinjau ditunda 600 ms supaya tidak memanggil backend tiap ketukan.
  // Semua setState terjadi di dalam callback timer, bukan langsung di body
  // effect (aturan react-hooks/set-state-in-effect).
  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => {
      if (!form.about_md.trim()) {
        setPreview("")
        return
      }
      apiRequest<{ html: string }>("/public/karya_preview", {
        method: "POST",
        body: { about_md: form.about_md },
      })
        .then((r) => setPreview(r.html))
        .catch(() => setPreview(""))
    }, 600)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [form.about_md])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!image) {
      setError("Foto karya wajib diunggah.")
      return
    }
    if (!terms) {
      setError("Kamu perlu menyetujui Syarat & Ketentuan.")
      return
    }
    setSending(true)
    try {
      const body = new FormData()
      for (const [k, v] of Object.entries(form)) body.append(k, v)
      body.append("image", image)
      const res = await apiRequest<Result>("/public/karya", { method: "POST", body })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim karya")
    } finally {
      setSending(false)
    }
  }

  if (result) {
    return (
      <div className="rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/15 bg-[var(--landing-paper-raised)] p-8">
        <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-accent-deep)]">
          Karya terkirim
        </p>
        <p className="mt-3 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)]">
          Simpan kode ini untuk mengecek status kirimanmu:
        </p>
        <p className="mt-4 select-all font-[family-name:var(--font-landing-display)] text-4xl font-extrabold tracking-[-0.02em] text-[var(--landing-ink)] tabular-nums">
          {result.code}
        </p>
        <p className="mt-4 max-w-[46ch] font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink-muted)]">
          Karya akan ditinjau pengurus lebih dulu. Selama belum tayang, kode ini satu-satunya cara
          melihat statusnya — tidak ada akun yang menyimpannya untukmu.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/karya/status"
            className="rounded-full bg-[var(--landing-ink)] px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] no-underline"
          >
            Cek status
          </Link>
          <Link
            href="/karya"
            className="rounded-full border border-[var(--landing-ink)]/25 px-5 py-2.5 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-ink)] no-underline"
          >
            Lihat katalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Field label="Nama karya" hint="Judul repo atau nama proyeknya.">
        <input
          required
          minLength={3}
          maxLength={150}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="Nama pengirim" hint="Untuk kredit di halaman karya.">
        <input
          required
          minLength={3}
          maxLength={150}
          value={form.author_name}
          onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="Asal himpunan">
        <select
          required
          value={form.himpunan_id}
          onChange={(e) => setForm({ ...form, himpunan_id: e.target.value })}
          className={inputClass}
        >
          <option value="">Pilih himpunan…</option>
          {himpunan.map((h) => (
            <option key={h.id} value={h.id}>
              {h.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Link repositori" hint="Harus https://github.com/pengguna/repositori dan bersifat publik.">
        <input
          required
          type="url"
          placeholder="https://github.com/pengguna/repositori"
          value={form.repo_url}
          onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
          className={inputClass}
        />
      </Field>

      <Field label="Tentang karya (markdown)" hint={`${form.about_md.length}/${MAX_ABOUT} karakter, minimal ${MIN_ABOUT}.`}>
        <textarea
          required
          minLength={MIN_ABOUT}
          maxLength={MAX_ABOUT}
          rows={10}
          value={form.about_md}
          onChange={(e) => setForm({ ...form, about_md: e.target.value })}
          className={`${inputClass} font-mono text-[0.85rem] leading-relaxed`}
        />
      </Field>

      {preview ? (
        <div>
          <p className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
            Pratinjau
          </p>
          <div
            className="landing-prose mt-3 rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/12 bg-[var(--landing-paper-raised)] p-5"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        </div>
      ) : null}

      <Field label="Foto karya" hint="JPG, PNG, atau WebP. Maksimal 8 MB, otomatis dikecilkan.">
        <input
          required
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          className="block w-full font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--landing-ink)] file:px-4 file:py-2 file:font-semibold file:text-[var(--landing-on-ink)]"
        />
      </Field>

      {/* Honeypot: tersembunyi dari manusia, hanya terisi bot. */}
      <div aria-hidden className="hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </label>
      </div>

      <label className="flex items-start gap-3 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)]">
        <input
          type="checkbox"
          required
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          className="mt-1 size-4 accent-[var(--landing-accent)]"
        />
        <span>
          Saya menyetujui{" "}
          <Link href="/karya/snk" className="font-semibold underline underline-offset-4">
            Syarat &amp; Ketentuan
          </Link>{" "}
          pengajuan karya, dan menyatakan karya ini milik saya atau saya berhak mempublikasikannya.
        </span>
      </label>

      {error ? (
        <p role="alert" className="rounded-[var(--landing-radius-md)] border border-[var(--landing-accent-deep)]/40 bg-[var(--landing-accent-deep)]/10 px-4 py-3 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-2 w-fit rounded-full bg-[var(--landing-ink)] px-6 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold text-[var(--landing-on-ink)] transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
      >
        {sending ? "Mengirim…" : "Kirim karya"}
      </button>
    </form>
  )
}

const inputClass =
  "w-full rounded-[var(--landing-radius-md)] border border-[var(--landing-ink)]/20 bg-[var(--landing-paper-raised)] px-4 py-2.5 font-[family-name:var(--font-landing-body)] text-sm text-[var(--landing-ink)] outline-none focus:border-[var(--landing-ink)]/60"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-[family-name:var(--font-landing-label)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--landing-ink-muted)]">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-[family-name:var(--font-landing-body)] text-xs text-[var(--landing-ink-muted)]">{hint}</span>
      ) : null}
    </label>
  )
}
