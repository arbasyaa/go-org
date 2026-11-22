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
import { FormSelect } from "@/components/form-select"
import { ImageUploadField } from "@/components/image-upload-field"
import { ErrorState } from "@/components/page-states"
import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatCurrency, unwrapList } from "@/lib/format"
import type { MerchItem } from "@/lib/public-content"
import { storageUrl } from "@/lib/storage-url"

const CATEGORY_SUGGESTIONS = ["Apparel", "Aksesoris", "Stiker", "Lainnya"]

const STOCK_OPTIONS = [
  { value: "ready", label: "Ready" },
  { value: "preorder", label: "Pre-order" },
  { value: "soldout", label: "Habis" },
]

type FormState = {
  name: string
  description: string
  price: string
  category: string
  stock_status: string
  order_url: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "0",
  category: "",
  stock_status: "ready",
  order_url: "",
  sort_order: "0",
  is_active: true,
}

function StockBadge({ status }: { status: string }) {
  const label =
    STOCK_OPTIONS.find((o) => o.value === status)?.label ?? status
  const variant =
    status === "ready"
      ? "default"
      : status === "soldout"
        ? "destructive"
        : "secondary"
  return <Badge variant={variant}>{label}</Badge>
}

export default function AdminMerchPage() {
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("merch.manage")
  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<MerchItem[] | { items: MerchItem[] }>(
      "/merch"
    )
    return unwrapList(result)
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MerchItem | null>(null)
  const [deleting, setDeleting] = useState<MerchItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const stats = useMemo(
    () => [
      { label: "Total Produk", value: data?.length ?? 0 },
      { label: "Aktif", value: data?.filter((m) => m.is_active).length ?? 0 },
    ],
    [data]
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setImageFile(null)
    setRemoveImage(false)
    setOpen(true)
  }

  function openEdit(row: MerchItem) {
    setEditing(row)
    setForm({
      name: row.name,
      description: row.description ?? "",
      price: String(row.price ?? 0),
      category: row.category ?? "",
      stock_status: row.stock_status || "ready",
      order_url: row.order_url ?? "",
      sort_order: String(row.sort_order ?? 0),
      is_active: row.is_active,
    })
    setImageFile(null)
    setRemoveImage(false)
    setOpen(true)
  }

  function buildBody(item: FormState) {
    const body = new FormData()
    body.append("name", item.name)
    body.append("description", item.description)
    body.append("price", item.price || "0")
    body.append("category", item.category)
    body.append("stock_status", item.stock_status)
    body.append("order_url", item.order_url)
    body.append("sort_order", item.sort_order || "0")
    body.append("is_active", item.is_active ? "true" : "false")
    return body
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const body = buildBody(form)
      if (imageFile) body.append("image", imageFile)
      else if (editing && removeImage) body.append("remove_image", "true")
      if (editing) {
        await apiRequest(`/merch/${editing.id}`, { method: "PUT", body })
      } else {
        await apiRequest("/merch", { method: "POST", body })
      }
      toast.success(editing ? "Merch diperbarui" : "Merch dibuat")
      setOpen(false)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan merch")
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row: MerchItem, next: boolean) {
    setTogglingId(row.id)
    try {
      const body = buildBody({
        name: row.name,
        description: row.description ?? "",
        price: String(row.price ?? 0),
        category: row.category ?? "",
        stock_status: row.stock_status || "ready",
        order_url: row.order_url ?? "",
        sort_order: String(row.sort_order ?? 0),
        is_active: next,
      })
      await apiRequest(`/merch/${row.id}`, { method: "PUT", body })
      toast.success(next ? "Merch diaktifkan" : "Merch dinonaktifkan")
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
      await apiRequest(`/merch/${deleting.id}`, { method: "DELETE" })
      toast.success("Merch dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const columns = useMemo<ColumnDef<MerchItem>[]>(
    () => [
      {
        id: "gambar",
        header: "Gambar",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.image_url ? (
            <img
              src={storageUrl(row.original.image_url)}
              alt={row.original.name}
              className="size-12 rounded-md border object-cover"
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
        id: "harga",
        accessorKey: "price",
        header: sortableHeader("Harga"),
        cell: ({ row }) => formatCurrency(row.original.price),
      },
      {
        id: "kategori",
        accessorKey: "category",
        header: "Kategori",
        cell: ({ row }) => row.original.category || "-",
      },
      {
        id: "stok",
        accessorKey: "stock_status",
        header: "Stok",
        cell: ({ row }) => <StockBadge status={row.original.stock_status} />,
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
        title="Merch"
        crumbs={[{ label: "Admin" }, { label: "Merch" }]}
      >
        <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
      </AdvancedResourcePage>
    )
  }

  return (
    <AdvancedResourcePage
      title="Merch"
      crumbs={[
        { label: "Admin", href: "/dashboard" },
        { label: "Merch" },
      ]}
      stats={stats}
      actions={<Button onClick={openCreate}>Tambah Merch</Button>}
    >
      <AdvancedDataTable
        columns={columns}
        data={data ?? []}
        loading={loading}
        error={error}
        emptyMessage="Belum ada merch"
        searchPlaceholder="Cari merch..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Merch" : "Merch Baru"}
        onSubmit={handleSubmit}
        saving={saving}
        className="sm:max-w-2xl"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Nama</FieldLabel>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Deskripsi</FieldLabel>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Harga (Rp)</FieldLabel>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Kategori</FieldLabel>
              <Input
                list="merch-categories"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              />
              <datalist id="merch-categories">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field>
              <FieldLabel>Status Stok</FieldLabel>
              <FormSelect
                value={form.stock_status}
                onValueChange={(stock_status) =>
                  setForm({ ...form, stock_status })
                }
                options={STOCK_OPTIONS}
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
            <FieldLabel>Link Pemesanan</FieldLabel>
            <Input
              type="url"
              placeholder="https://wa.me/62..."
              value={form.order_url}
              onChange={(e) => setForm({ ...form, order_url: e.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel>Gambar</FieldLabel>
            <ImageUploadField
              value={imageFile}
              onChange={(file) => {
                setImageFile(file)
                setRemoveImage(file === null && !!editing?.image_url)
              }}
              existingUrl={
                editing?.image_url ? storageUrl(editing.image_url) : null
              }
              alt="Pratinjau gambar merch"
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
        title="Hapus Merch"
        description={`Apakah Anda yakin ingin menghapus "${deleting?.name}"?`}
        onConfirm={handleDelete}
      />
    </AdvancedResourcePage>
  )
}
