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
import type { WorkProgramItem } from "@/lib/public-content"

const CADENCE_SUGGESTIONS = ["Tahunan", "Semesteran", "Berkelanjutan", "Per periode"]

type FormState = {
  name: string
  description: string
  cadence: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: "",
  description: "",
  cadence: "",
  sort_order: "0",
  is_active: true,
}

function toForm(row: WorkProgramItem, is_active = row.is_active): FormState {
  return {
    name: row.name,
    description: row.description ?? "",
    cadence: row.cadence ?? "",
    sort_order: String(row.sort_order ?? 0),
    is_active,
  }
}

function buildBody(item: FormState) {
  const body = new FormData()
  body.append("name", item.name)
  body.append("description", item.description)
  body.append("cadence", item.cadence)
  body.append("sort_order", item.sort_order || "0")
  body.append("is_active", item.is_active ? "true" : "false")
  return body
}

export default function AdminWorkProgramsPage() {
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("work_program.manage")
  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<
      WorkProgramItem[] | { items: WorkProgramItem[] }
    >("/work_programs")
    return unwrapList(result)
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<WorkProgramItem | null>(null)
  const [deleting, setDeleting] = useState<WorkProgramItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const stats = useMemo(
    () => [
      { label: "Total Program", value: data?.length ?? 0 },
      { label: "Aktif", value: data?.filter((m) => m.is_active).length ?? 0 },
    ],
    [data]
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(row: WorkProgramItem) {
    setEditing(row)
    setForm(toForm(row))
    setOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const body = buildBody(form)
      if (editing) {
        await apiRequest(`/work_programs/${editing.id}`, { method: "PUT", body })
      } else {
        await apiRequest("/work_programs", { method: "POST", body })
      }
      toast.success(editing ? "Program kerja diperbarui" : "Program kerja dibuat")
      setOpen(false)
      void refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan program kerja"
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row: WorkProgramItem, next: boolean) {
    setTogglingId(row.id)
    try {
      await apiRequest(`/work_programs/${row.id}`, {
        method: "PUT",
        body: buildBody(toForm(row, next)),
      })
      toast.success(next ? "Program diaktifkan" : "Program dinonaktifkan")
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
      await apiRequest(`/work_programs/${deleting.id}`, { method: "DELETE" })
      toast.success("Program kerja dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const columns = useMemo<ColumnDef<WorkProgramItem>[]>(
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
        id: "periode",
        accessorKey: "cadence",
        header: "Periode",
        cell: ({ row }) => row.original.cadence || "-",
      },
      {
        id: "deskripsi",
        accessorKey: "description",
        header: "Deskripsi",
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-md text-muted-foreground">
            {row.original.description || "-"}
          </span>
        ),
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
        title="Program Kerja"
        crumbs={[{ label: "Admin" }, { label: "Program Kerja" }]}
      >
        <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
      </AdvancedResourcePage>
    )
  }

  return (
    <AdvancedResourcePage
      title="Program Kerja"
      crumbs={[
        { label: "Admin", href: "/dashboard" },
        { label: "Program Kerja" },
      ]}
      stats={stats}
      actions={<Button onClick={openCreate}>Tambah Program</Button>}
    >
      <AdvancedDataTable
        columns={columns}
        data={data ?? []}
        loading={loading}
        error={error}
        emptyMessage="Belum ada program kerja"
        searchPlaceholder="Cari program kerja..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Program Kerja" : "Program Kerja Baru"}
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
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Periode</FieldLabel>
              <Input
                list="work-program-cadences"
                value={form.cadence}
                onChange={(e) => setForm({ ...form, cadence: e.target.value })}
              />
              <datalist id="work-program-cadences">
                {CADENCE_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
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
        title="Hapus Program Kerja"
        description={`Apakah Anda yakin ingin menghapus "${deleting?.name}"?`}
        onConfirm={handleDelete}
      />
    </AdvancedResourcePage>
  )
}
