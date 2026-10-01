"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FormDialog } from "@/components/advanced-table"
import { ImageUploadField } from "@/components/image-upload-field"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePermissionCategories } from "@/hooks/use-permission-categories"
import { apiRequest } from "@/lib/api"
import {
  isPermissionClosed,
  permissionDeadlineLabel,
} from "@/lib/permission-deadline"

/** Batas ukuran file di klien; backend memakai batas yang sama. */
const MAX_PROOF_MB = 8
const PROOF_ACCEPT = "image/jpeg,image/png,image/webp"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Gagal membaca file"))
    reader.readAsDataURL(file)
  })
}

export function IzinRequestDialog({
  eventId,
  eventStartTime,
  open,
  onOpenChange,
  onSuccess,
}: {
  eventId: number
  /** Waktu mulai event — dipakai untuk mengecek batas H-3 jam. */
  eventStartTime?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { categories } = usePermissionCategories()
  const [categoryId, setCategoryId] = useState("")
  const [reason, setReason] = useState("")
  const [proof, setProof] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const closed = isPermissionClosed(eventStartTime)
  const deadlineLabel = permissionDeadlineLabel(eventStartTime)
  // Kategori default = pilihan pertama; tanpa state turunan supaya tidak ada
  // setState di dalam effect.
  const selectedCategory =
    categoryId || (categories[0] ? String(categories[0].id) : "")

  async function handleSubmit() {
    if (closed) {
      toast.error("Pengajuan izin sudah ditutup (maksimal 3 jam sebelum mulai)")
      return
    }
    if (!selectedCategory) {
      toast.error("Pilih kategori izin")
      return
    }
    if (!proof) {
      toast.error("Bukti gambar wajib diunggah")
      return
    }
    setSaving(true)
    try {
      await apiRequest("/permission_requests", {
        method: "POST",
        body: {
          event_id: eventId,
          category_id: Number(selectedCategory),
          reason: reason.trim(),
          proof: await fileToDataUrl(proof),
        },
      })
      toast.success("Pengajuan izin terkirim, menunggu persetujuan")
      onOpenChange(false)
      setReason("")
      setProof(null)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengajukan izin")
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Ajukan Izin"
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Kirim Pengajuan"
      submitDisabled={closed}
    >
      <FieldGroup>
        {closed ? (
          <p className="text-xs text-muted-foreground">
            Izin sudah ditutup{deadlineLabel ? ` sejak ${deadlineLabel}` : ""} —
            batas pengajuan 3 jam sebelum event mulai.
          </p>
        ) : null}

        <Field>
          <FieldLabel>Kategori</FieldLabel>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              if (value != null) setCategoryId(String(value))
            }}
          >
            <SelectTrigger>
              <SelectValue>
                {(value: unknown) =>
                  categories.find((c) => String(c.id) === String(value))
                    ?.name ?? "Pilih kategori izin"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Kategori izin belum tersedia — hubungi pengurus.
            </p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel>Keterangan (opsional)</FieldLabel>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tambahan penjelasan bila perlu"
            rows={3}
          />
        </Field>

        <Field>
          <FieldLabel>Bukti Gambar (wajib)</FieldLabel>
          <ImageUploadField
            value={proof}
            onChange={setProof}
            maxSizeMB={MAX_PROOF_MB}
            accept={PROOF_ACCEPT}
            alt="Pratinjau bukti izin"
          />
          <p className="text-xs text-muted-foreground">
            Unggah foto surat/keterangan. Gambar otomatis dikonversi ke WebP oleh
            server agar hemat penyimpanan.
          </p>
        </Field>
      </FieldGroup>
    </FormDialog>
  )
}
