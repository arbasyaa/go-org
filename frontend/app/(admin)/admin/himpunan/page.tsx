"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  FormDialog,
  sortableHeader,
} from "@/components/advanced-table"
import { ImageUploadField } from "@/components/image-upload-field"
import { FormSelect } from "@/components/form-select"
import { ErrorState } from "@/components/page-states"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { unwrapList } from "@/lib/format"
import type { HimpunanItem } from "@/lib/public-content"
import { storageUrl } from "@/lib/storage-url"

const regionOptions = [
  { value: "0", label: "Belum ditentukan" },
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Daerah ${n}` })),
]

type FormState = {
  name: string
  short_label: string
  institution: string
  city: string
  address: string
  email: string
  sort_order: string
  region: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: "",
  short_label: "",
  institution: "",
  city: "",
  address: "",
  email: "",
  sort_order: "0",
  region: "0",
  is_active: true,
}

function toForm(row: HimpunanItem, is_active = row.is_active): FormState {
  return {
    name: row.name,
    short_label: row.short_label ?? "",
    institution: row.institution ?? "",
    city: row.city ?? "",
    address: row.address ?? "",
    email: row.email ?? "",
    sort_order: String(row.sort_order ?? 0),
    region: String(row.region ?? 0),
    is_active,
  }
}

function buildBody(item: FormState) {
  const body = new FormData()
  body.append("name", item.name)
  body.append("short_label", item.short_label)
  body.append("institution", item.institution)
  body.append("city", item.city)
  body.append("address", item.address)
  body.append("email", item.email)
  body.append("sort_order", item.sort_order || "0")
  body.append("region", item.region || "0")
  body.append("is_active", item.is_active ? "true" : "false")
  return body
}

export default function AdminHimpunanPage() {
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("himpunan.manage")
  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<HimpunanItem[] | { items: HimpunanItem[] }>(
      "/himpunan"
    )
    return unwrapList(result)
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<HimpunanItem | null>(null)
  const [deleting, setDeleting] = useState<HimpunanItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)

  const stats = useMemo(
    () => [
      { label: "Total Himpunan", value: data?.length ?? 0 },
      { label: "Aktif", value: data?.filter((m) => m.is_active).length ?? 0 },
      {
        label: "Kota",
        value: new Set(data?.map((m) => m.city).filter(Boolean)).size,
      },
    ],
    [data]
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setLogoFile(null)
    setRemoveLogo(false)
    setOpen(true)
  }

  function openEdit(row: HimpunanItem) {
    setEditing(row)
    setForm(toForm(row))
    setLogoFile(null)
    setRemoveLogo(false)
    setOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const body = buildBody(form)
      if (logoFile) body.append("image", logoFile)
      else if (editing && removeLogo) body.append("remove_image", "true")
      if (editing) {
        await apiRequest(`/himpunan/${editing.id}`, { method: "PUT", body })
      } else {
        await apiRequest("/himpunan", { method: "POST", body })
      }
      toast.success(editing ? "Himpunan diperbarui" : "Himpunan dibuat")
      setOpen(false)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan himpunan")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row: HimpunanItem, next: boolean) {
    setTogglingId(row.id)
    try {
      await apiRequest(`/himpunan/${row.id}`, {
        method: "PUT",
        body: buildBody(toForm(row, next)),
      })
      toast.success(next ? "Himpunan diaktifkan" : "Himpunan dinonaktifkan")
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status")
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await apiRequest(`/himpunan/${deleting.id}`, { method: "DELETE" })
      toast.success("Himpunan dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const columns = useMemo<ColumnDef<HimpunanItem>[]>(
    () => [
      {
        id: "logo",
        header: "Logo",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.logo_url ? (
            <img
              src={storageUrl(row.original.logo_url)}
              alt={row.original.name}
              className="size-12 rounded-md border bg-white object-contain p-1"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="size-12 rounded-md border bg-muted" />
          ),
      },
      {
        id: "nama",
        accessorKey: "name",
        header: sortableHeader("Nama"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "instansi",
        accessorKey: "institution",
        header: sortableHeader("Instansi"),
        cell: ({ row }) => row.original.institution || "-",
      },
      {
        id: "kota",
        accessorKey: "city",
        header: sortableHeader("Kota"),
        cell: ({ row }) => row.original.city || "-",
      },
      {
        id: "daerah",
        accessorFn: (row) => row.region ?? 0,
        header: sortableHeader("Daerah"),
        cell: ({ row }) =>
          row.original.region ? `Daerah ${row.original.region}` : "-",
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || "-",
      },
      {
        id: "aktif",
        accessorKey: "is_active",
        header: "Aktif",
        cell: ({ row }) => (
          <Switch
            checked={row.original.is_active}
            disabled={togglingId === row.original.id}
            onCheckedChange={(next) => void toggleActive(row.original, next)}
            aria-label={`Aktifkan ${row.original.name}`}
          />
        ),
      },
      {
        id: "urutan",
        accessorKey: "sort_order",
        header: sortableHeader("Urutan"),
      },
      {
        id: "aksi",
        enableHiding: false,
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className="mr-1 size-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleting(row.original)}
            >
              <Trash2Icon className="mr-1 size-4" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [togglingId]
  )

  if (!authLoading && !allowed) {
    return (
      <AdvancedResourcePage
        title="Himpunan"
        crumbs={[{ label: "Admin" }, { label: "Himpunan" }]}
      >
        <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
      </AdvancedResourcePage>
    )
  }

  return (
    <AdvancedResourcePage
      title="Himpunan"
      crumbs={[
        { label: "Admin", href: "/dashboard" },
        { label: "Himpunan" },
      ]}
      stats={stats}
      actions={<Button onClick={openCreate}>Tambah Himpunan</Button>}
    >
      <AdvancedDataTable
        columns={columns}
        data={data ?? []}
        loading={loading}
        error={error}
        emptyMessage="Belum ada himpunan"
        searchPlaceholder="Cari himpunan..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Himpunan" : "Himpunan Baru"}
        onSubmit={handleSubmit}
        saving={saving}
        className="sm:max-w-2xl"
      >
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Nama</FieldLabel>
              <Input
                value={form.name}
                maxLength={150}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Label Pendek (marquee)</FieldLabel>
              <Input
                value={form.short_label}
                maxLength={60}
                onChange={(e) =>
                  setForm({ ...form, short_label: e.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Instansi / Kampus</FieldLabel>
              <Input
                value={form.institution}
                maxLength={200}
                onChange={(e) =>
                  setForm({ ...form, institution: e.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Kota</FieldLabel>
              <Input
                value={form.city}
                maxLength={100}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Daerah</FieldLabel>
              <FormSelect
                value={form.region}
                onValueChange={(region) => setForm({ ...form, region })}
                options={regionOptions}
              />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={form.email}
                maxLength={150}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Urutan</FieldLabel>
              <Input
                type="number"
                step={1}
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: e.target.value })
                }
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Alamat</FieldLabel>
            <Textarea
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel>Logo</FieldLabel>
            <ImageUploadField
              value={logoFile}
              onChange={(file) => {
                setLogoFile(file)
                setRemoveLogo(file === null && !!editing?.logo_url)
              }}
              existingUrl={
                editing?.logo_url ? storageUrl(editing.logo_url) : null
              }
              alt="Pratinjau logo himpunan"
            />
          </Field>
          <Field orientation="horizontal">
            <Switch
              checked={form.is_active}
              onCheckedChange={(is_active) => setForm({ ...form, is_active })}
            />
            <FieldLabel>Aktif (tampil di landing page)</FieldLabel>
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(next) => {
          if (!next) setDeleting(null)
        }}
        title="Hapus Himpunan"
        description={`Apakah Anda yakin ingin menghapus "${deleting?.name}"?`}
        onConfirm={handleDelete}
      />
    </AdvancedResourcePage>
  )
}
