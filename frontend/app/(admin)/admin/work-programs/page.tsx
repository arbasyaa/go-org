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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { unwrapList } from "@/lib/format"
import { formatProgramDate, categoryLabel, statusLabel } from "@/lib/landing/program"
import type { WorkProgramItem } from "@/lib/public-content"
import type { Division } from "@/lib/types"

const CADENCE_SUGGESTIONS = ["Tahunan", "Semesteran", "Berkelanjutan", "Per periode"]

const CATEGORY_ITEMS = [
  { value: "program_kerja", label: "Program Kerja" },
  { value: "agenda", label: "Agenda" },
]

const STATUS_ITEMS = [
  { value: "upcoming", label: "Akan datang" },
  { value: "done", label: "Selesai" },
]

/** Nilai Select untuk "tanpa divisi" (Select tidak menerima string kosong sebagai pilihan). */
const NO_DIVISION = "none"

type FormState = {
  name: string
  description: string
  cadence: string
  category: string
  status: string
  division_id: string
  start_date: string
  end_date: string
  location: string
  host: string
  sort_order: string
  is_active: boolean
}

const emptyForm: FormState = {
  name: "",
  description: "",
  cadence: "",
  category: "program_kerja",
  status: "upcoming",
  division_id: NO_DIVISION,
  start_date: "",
  end_date: "",
  location: "",
  host: "",
  sort_order: "0",
  is_active: true,
}

function toForm(row: WorkProgramItem, is_active = row.is_active): FormState {
  return {
    name: row.name,
    description: row.description ?? "",
    cadence: row.cadence ?? "",
    category: row.category || "program_kerja",
    status: row.status || "upcoming",
    division_id: row.division_id ? String(row.division_id) : NO_DIVISION,
    start_date: row.start_date?.slice(0, 10) ?? "",
    end_date: row.end_date?.slice(0, 10) ?? "",
    location: row.location ?? "",
    host: row.host ?? "",
    sort_order: String(row.sort_order ?? 0),
    is_active,
  }
}

function buildBody(item: FormState) {
  const body = new FormData()
  body.append("name", item.name)
  body.append("description", item.description)
  body.append("cadence", item.cadence)
  body.append("category", item.category)
  body.append("status", item.status)
  // Kosong = hapus nilai (null di backend).
  body.append("division_id", item.division_id === NO_DIVISION ? "" : item.division_id)
  body.append("start_date", item.start_date)
  body.append("end_date", item.end_date)
  body.append("location", item.location)
  body.append("host", item.host)
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
  const divisions = useApi(() =>
    apiRequest<Division[] | { items: Division[] }>("/divisions").then(unwrapList)
  )
  const divisionItems = useMemo(
    () => [
      { value: NO_DIVISION, label: "Tanpa divisi" },
      ...(divisions.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
    ],
    [divisions.data]
  )
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
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai")
      return
    }
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
        id: "kategori",
        accessorKey: "category",
        header: "Kategori",
        cell: ({ row }) => categoryLabel(row.original.category || "program_kerja"),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "done" ? "secondary" : "default"}
          >
            {statusLabel(row.original.status || "upcoming")}
          </Badge>
        ),
      },
      {
        id: "tanggal",
        accessorKey: "start_date",
        header: "Tanggal",
        cell: ({ row }) =>
          formatProgramDate(row.original.start_date, row.original.end_date) || "-",
      },
      {
        id: "divisi",
        accessorKey: "division_name",
        header: "Divisi",
        cell: ({ row }) => row.original.division_name || "-",
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
              <FieldLabel>Kategori</FieldLabel>
              <Select
                items={CATEGORY_ITEMS}
                value={form.category}
                onValueChange={(v) => {
                  if (v == null) return
                  setForm({ ...form, category: v })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ITEMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                items={STATUS_ITEMS}
                value={form.status}
                onValueChange={(v) => {
                  if (v == null) return
                  setForm({ ...form, status: v })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Divisi penyelenggara</FieldLabel>
              <Select
                items={divisionItems}
                value={form.division_id}
                onValueChange={(v) => {
                  if (v == null) return
                  setForm({ ...form, division_id: v })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent>
                  {divisionItems.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Tuan rumah</FieldLabel>
              <Input
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Tanggal mulai</FieldLabel>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>Tanggal selesai</FieldLabel>
              <Input
                type="date"
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Lokasi pelaksanaan</FieldLabel>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
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
