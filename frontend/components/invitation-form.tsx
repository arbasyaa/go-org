"use client"

import { useRef, useState } from "react"
import { FileTextIcon, Loader2Icon, UploadCloudIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/api"
import { cn } from "@/lib/utils"

const MAX_BYTES = 5 * 1024 * 1024

const fieldClass =
  "h-14 rounded-none border-0 border-b-2 border-[var(--landing-ink)]/15 bg-transparent px-0 font-[family-name:var(--font-landing-display)] text-lg font-bold text-[var(--landing-ink)] shadow-none transition-[border-color] duration-500 placeholder:font-[family-name:var(--font-landing-body)] placeholder:text-base placeholder:font-normal placeholder:text-[var(--landing-ink-soft)] focus-visible:border-[var(--landing-accent-deep)] focus-visible:ring-0 md:text-xl"

/**
 * Form undangan publik (POST /public/invitations), gaya landing.
 *
 * Tiap isian adalah baris bernomor bergaris bawah (tanpa kotak) dengan
 * indikator kelengkapan di atas form; zona unggah bereaksi saat berkas
 * diseret. Logika validasi sama dengan backend: PDF saja, maksimal 5 MB,
 * honeypot `website` harus kosong.
 */
export function InvitationForm() {
  const [organizationName, setOrganizationName] = useState("")
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [honeypot, setHoneypot] = useState("")
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filled = [organizationName.trim(), eventName.trim(), eventDate, file].filter(Boolean).length

  function pickFile(next: File | null) {
    setError(null)
    if (!next) {
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    if (next.type !== "application/pdf" && !next.name.toLowerCase().endsWith(".pdf")) {
      setError("Lampiran harus berupa berkas PDF.")
      return
    }
    if (next.size > MAX_BYTES) {
      setError("Ukuran lampiran maksimal 5 MB.")
      return
    }
    setFile(next)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    if (!file) {
      setError("Lampiran PDF wajib diunggah.")
      return
    }

    const body = new FormData()
    body.set("organization_name", organizationName)
    body.set("event_name", eventName)
    body.set("event_date", eventDate)
    body.set("attachment", file)
    // Honeypot: dibaca backend, harus tetap kosong.
    body.set("website", honeypot)

    setSubmitting(true)
    try {
      await apiRequest("/public/invitations", { method: "POST", body })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim undangan.")
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-6 rounded-[var(--landing-radius-md)] bg-[var(--landing-ink)] p-8 text-[var(--landing-on-ink)] motion-safe:animate-[landing-card-in_0.9s_cubic-bezier(0.16,1,0.3,1)_both] md:p-12"
      >
        <svg viewBox="0 0 52 52" className="size-16" aria-hidden>
          <circle cx="26" cy="26" r="24" fill="none" stroke="var(--landing-cyan)" strokeWidth="2" pathLength={1} className="[stroke-dasharray:1] motion-safe:animate-[landing-draw_0.9s_ease-out_both]" />
          <path d="M15 27l7 7 15-16" fill="none" stroke="var(--landing-on-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="[stroke-dasharray:1] motion-safe:animate-[landing-draw_0.6s_0.6s_ease-out_both]" />
        </svg>
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-landing-display)] text-3xl font-extrabold md:text-4xl">Undangan terkirim.</h2>
          <p className="max-w-[46ch] font-[family-name:var(--font-landing-body)] text-sm leading-relaxed text-[var(--landing-on-ink-dim)] md:text-base">
            Terima kasih. Undangan <strong className="text-[var(--landing-on-ink)]">{eventName}</strong> sudah masuk ke kotak sekretariat dan akan ditindaklanjuti oleh pengurus.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDone(false)
            setOrganizationName("")
            setEventName("")
            setEventDate("")
            setFile(null)
          }}
          className="rounded-full border border-[var(--landing-on-ink)]/35 px-6 py-3 font-[family-name:var(--font-landing-body)] text-sm font-semibold transition-colors hover:bg-[var(--landing-on-ink)] hover:text-[var(--landing-ink)]"
        >
          Kirim undangan lain
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-labelledby="form-undangan-title"
      className="rounded-[var(--landing-radius-md)] bg-[var(--landing-paper-raised)] p-6 text-[var(--landing-ink)] shadow-[0_40px_80px_-50px_rgb(39_21_110/0.55)] md:p-10"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="form-undangan-title" className="font-[family-name:var(--font-landing-display)] text-2xl font-extrabold">
          Formulir undangan
        </h2>
        <p className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]" aria-live="polite">
          {filled}/4 terisi
        </p>
      </div>
      <div aria-hidden className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--landing-ink)]/10">
        <div
          className="h-full origin-left rounded-full bg-[var(--landing-accent-deep)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${filled / 4})` }}
        />
      </div>

      <div className="mt-8 space-y-8">
        <Row n={1} htmlFor="organization_name" label="Nama himpunan / instansi">
          <Input id="organization_name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="HIMATIKA Universitas Sebelas Maret" maxLength={150} required autoComplete="organization" className={fieldClass} />
        </Row>
        <Row n={2} htmlFor="event_name" label="Nama acara">
          <Input id="event_name" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Seminar Nasional Teknologi 2026" maxLength={200} required className={fieldClass} />
        </Row>
        <Row n={3} htmlFor="event_date" label="Tanggal berlangsung acara">
          <Input id="event_date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={fieldClass} />
        </Row>
        <Row n={4} htmlFor="attachment" label="Surat undangan (PDF, maks. 5 MB)">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              pickFile(e.dataTransfer.files?.[0] ?? null)
            }}
            className={cn(
              "mt-3 rounded-[var(--landing-radius-md)] border-2 border-dashed p-6 transition-[border-color,background-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              dragging
                ? "scale-[1.02] border-[var(--landing-accent-deep)] bg-[var(--landing-accent)]/[0.06]"
                : "border-[var(--landing-ink)]/20"
            )}
          >
            {file ? (
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--landing-ink)] text-[var(--landing-on-ink)]">
                    <FileTextIcon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{file.name}</span>
                    <span className="block text-xs text-[var(--landing-ink-muted)]">{(file.size / 1024).toFixed(0)} KB · siap dikirim</span>
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Hapus lampiran"
                  onClick={() => pickFile(null)}
                  className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--landing-ink)]/10"
                >
                  <XIcon className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <UploadCloudIcon aria-hidden className={cn("size-9 text-[var(--landing-ink-muted)] transition-transform duration-500", dragging && "-translate-y-1 text-[var(--landing-accent-deep)]")} />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="rounded-full bg-[var(--landing-ink)] px-5 py-2.5 text-sm font-semibold text-[var(--landing-on-ink)] transition-[background-color,transform] duration-300 hover:bg-[var(--landing-accent-deep)] active:scale-95"
                >
                  Pilih berkas PDF
                </button>
                <p className="text-xs text-[var(--landing-ink-muted)]">atau seret berkas ke sini</p>
              </div>
            )}
            <input
              ref={inputRef}
              id="attachment"
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </Row>

        {/* Honeypot: disembunyikan dari pengguna, hanya bot yang mengisi. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {error ? (
          <p role="alert" className="rounded-[var(--landing-radius-sm)] bg-[var(--landing-accent)]/10 px-4 py-3 text-sm font-medium text-[var(--landing-accent-deep)]">
            {error}
          </p>
        ) : null}

        <div className="space-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-[var(--landing-accent-deep)] px-6 py-5 font-[family-name:var(--font-landing-body)] text-base font-semibold text-white transition-transform duration-300 active:scale-[0.98]"
          >
            <span aria-hidden className="absolute inset-0 -z-0 origin-left scale-x-0 bg-[var(--landing-ink)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
            <span className="relative flex items-center gap-3">
              {submitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Mengirim…
                </>
              ) : (
                <>
                  Kirim undangan
                  <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                </>
              )}
            </span>
          </button>
          <p className="text-center text-xs text-[var(--landing-ink-muted)]">
            Data hanya dipakai untuk menindaklanjuti undangan.
          </p>
        </div>
      </div>
    </form>
  )
}

function Row({ n, htmlFor, label, children }: { n: number; htmlFor: string; label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[2rem_1fr] gap-x-3">
      <span aria-hidden className="pt-0.5 font-[family-name:var(--font-landing-label)] text-xs font-semibold tabular-nums text-[var(--landing-accent-deep)]">
        {String(n).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="font-[family-name:var(--font-landing-label)] text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--landing-ink-muted)]">
          {label}
        </label>
        {children}
      </div>
    </div>
  )
}
