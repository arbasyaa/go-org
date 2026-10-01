"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  FormDialog,
  sortableHeader,
} from "@/components/advanced-table"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePermissionCategories } from "@/hooks/use-permission-categories"
import { apiRequest } from "@/lib/api"
import type { PermissionCategory } from "@/lib/types"

const emptyForm = { name: "", description: "" }

export default function PermissionCategoriesPage() {
  const { categories, loading, refetch } = usePermissionCategories()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PermissionCategory | null>(null)
  const [deleting, setDeleting] = useState<PermissionCategory | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const rows = useMemo(() => categories, [categories])
  const stats = useMemo(() => [{ label: "Total Kategori", value: rows.length }], [rows])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(item: PermissionCategory) {
    setEditing(item)
    setForm({ name: item.name, description: item.description ?? "" })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Nama kategori wajib diisi")
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await apiRequest(`/permission_categories/${editing.id}`, {
          method: "PUT",
          body: form,
        })
        toast.success("Kategori diperbarui")
      } else {
        await apiRequest("/permission_categories", { method: "POST", body: form })
        toast.success("Kategori ditambahkan")
      }
      setOpen(false)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setConfirming(true)
    try {
      await apiRequest(`/permission_categories/${deleting.id}`, {
        method: "DELETE",
      })
      toast.success("Kategori dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    } finally {
      setConfirming(false)
    }
  }

  const columns = useMemo<ColumnDef<PermissionCategory>[]>(
    () => [
      {
        id: "nama",
        accessorKey: "name",
        header: sortableHeader("Nama"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "deskripsi",
        accessorKey: "description",
        header: "Deskripsi",
        cell: ({ row }) => row.original.description || "-",
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
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleting(row.original)}
            >
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <AdvancedResourcePage
      title="Kategori Izin"
      crumbs={[
        { label: "Admin", href: "/admin/settings" },
        { label: "Approval Perizinan", href: "/admin/permissions" },
        { label: "Kategori" },
      ]}
      stats={stats}
      actions={<Button onClick={openCreate}>Tambah Kategori</Button>}
    >
      <AdvancedDataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="Belum ada kategori izin"
        searchPlaceholder="Cari kategori..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Kategori Izin" : "Kategori Izin Baru"}
        description="Kategori dipilih anggota saat mengajukan izin dan tampil di layar review."
        onSubmit={handleSubmit}
        saving={saving}
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Nama</FieldLabel>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="mis. Sakit, Izin, Dispensasi"
              required
            />
          </Field>
          <Field>
            <FieldLabel>Deskripsi</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Penjelasan singkat kategori ini"
            />
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(next) => {
          if (!next) setDeleting(null)
        }}
        title="Hapus kategori?"
        description={`Kategori "${deleting?.name ?? ""}" akan dihapus. Kategori yang sudah dipakai pengajuan izin tidak bisa dihapus.`}
        confirming={confirming}
        onConfirm={handleDelete}
      />
    </AdvancedResourcePage>
  )
}
