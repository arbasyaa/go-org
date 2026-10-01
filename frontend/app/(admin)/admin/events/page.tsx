"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  FormDialog,
  sortableHeader,
} from "@/components/advanced-table"
import {
  EventAudienceField,
  type EventAudienceValue,
} from "@/components/event-audience-field"
import { ImageUploadField } from "@/components/image-upload-field"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { useAudienceCatalog } from "@/hooks/use-audience-catalog"
import { apiRequest } from "@/lib/api"
import { toLocalInput, toRFC3339, endOfDayInput } from "@/lib/datetime"
import { formatDate, unwrapList } from "@/lib/format"
import { eventBannerUrl } from "@/lib/event-banner"
import { EventAudienceBadge } from "@/lib/event-audience"
import type { Event } from "@/lib/types"

const emptyForm = {
  title: "",
  description: "",
  location: "",
  link_url: "",
  start_time: "",
  end_time: "",
  allow_permission: false,
}

const emptyAudience: EventAudienceValue = {
  audience: "custom",
  divisionIds: [],
  roleIds: [],
}

export default function AdminEventsPage() {
  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<Event[] | { items: Event[] }>("/events")
    return unwrapList(result)
  })
  const catalog = useAudienceCatalog()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState<Event | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [audience, setAudience] = useState<EventAudienceValue>(emptyAudience)
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const rows = useMemo(() => data ?? [], [data])

  const stats = useMemo(
    () => [
      { label: "Total Event", value: rows.length },
      { label: "Upcoming", value: rows.filter((e) => e.status === "upcoming").length },
      { label: "Ongoing", value: rows.filter((e) => e.status === "ongoing").length },
      { label: "Finished", value: rows.filter((e) => e.status === "finished").length },
    ],
    [rows]
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setAudience(emptyAudience)
    setBannerFile(null)
    setOpen(true)
  }

  function openEdit(event: Event) {
    setEditing(event)
    setForm({
      title: event.title,
      description: event.description ?? "",
      location: event.location ?? "",
      link_url: event.link_url ?? "",
      start_time: toLocalInput(event.start_time),
      end_time: toLocalInput(event.end_time),
      allow_permission: !!event.allow_permission,
    })
    setAudience({
      audience: event.audience === "all" ? "all" : "custom",
      divisionIds: event.target_division_ids ?? [],
      roleIds: event.target_role_ids ?? [],
    })
    setBannerFile(null)
    setOpen(true)
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await apiRequest(`/events/${deleting.id}`, { method: "DELETE" })
      toast.success("Event dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const audienceFields = {
        audience: audience.audience,
        target_division_ids: audience.divisionIds,
        target_role_ids: audience.roleIds,
      }
      // Waktu selesai opsional: kosong = penghujung hari mulai (zona browser).
      const startTime = toRFC3339(form.start_time)
      const endTime = toRFC3339(form.end_time || endOfDayInput(form.start_time))
      if (editing && !bannerFile) {
        await apiRequest(`/events/${editing.id}`, {
          method: "PUT",
          body: {
            ...form,
            ...audienceFields,
            start_time: startTime,
            end_time: endTime,
          },
        })
      } else {
        const body = new FormData()
        body.append("title", form.title)
        body.append("description", form.description)
        body.append("location", form.location)
        body.append("link_url", form.link_url)
        body.append("start_time", startTime)
        body.append("end_time", endTime)
        body.append("allow_permission", String(form.allow_permission))
        body.append("audience", audience.audience)
        for (const id of audience.divisionIds)
          body.append("target_division_ids", String(id))
        for (const id of audience.roleIds) body.append("target_role_ids", String(id))
        if (bannerFile) body.append("banner", bannerFile)

        if (editing) {
          await apiRequest(`/events/${editing.id}`, { method: "PUT", body })
        } else {
          await apiRequest("/events", { method: "POST", body })
        }
      }
      toast.success(editing ? "Event diperbarui" : "Event dibuat")
      setOpen(false)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo<ColumnDef<Event>[]>(
    () => [
      {
        id: "banner",
        header: "Banner",
        enableSorting: false,
        cell: ({ row }) => {
          const url = eventBannerUrl(row.original)
          if (!url) {
            return (
              <div className="flex h-14 w-24 items-center justify-center rounded-lg border bg-muted text-[10px] text-muted-foreground">
                Tanpa gambar
              </div>
            )
          }
          return (
            <img
              src={url}
              alt={row.original.title}
              className="h-14 w-24 rounded-lg border object-cover shadow-sm"
                    loading="lazy"
                    decoding="async"
            />
          )
        },
      },
      {
        id: "judul",
        accessorKey: "title",
        header: sortableHeader("Judul"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "mulai",
        accessorKey: "start_time",
        header: sortableHeader("Mulai"),
        cell: ({ row }) => formatDate(row.original.start_time),
      },
      {
        id: "cakupan",
        header: "Untuk",
        enableSorting: false,
        cell: ({ row }) => <EventAudienceBadge event={row.original} />,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "aksi",
        enableHiding: false,
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => openEdit(row.original)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              render={<Link href={`/admin/events/${row.original.id}/recap`} />}
            >
              Rekap
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
      title="Event"
      crumbs={[{ label: "Admin", href: "/admin/settings" }, { label: "Event" }]}
      stats={stats}
      actions={<Button onClick={openCreate}>Buat Event</Button>}
    >
      <AdvancedDataTable
        columns={columns}
        data={rows}
        loading={loading}
        error={error}
        emptyMessage="Belum ada event"
        searchPlaceholder="Cari event..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Event" : "Buat Event"}
        onSubmit={handleSubmit}
        saving={saving}
        className="sm:max-w-2xl"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Judul</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Banner Event</FieldLabel>
            <ImageUploadField
              value={bannerFile}
              onChange={setBannerFile}
                existingUrl={editing ? eventBannerUrl(editing) : null}
              maxSizeMB={5}
            />
          </Field>
          <Field>
            <FieldLabel>Deskripsi</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Lokasi</FieldLabel>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Link Event</FieldLabel>
              <Input
                type="url"
                placeholder="https://meet.google.com/..."
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Mulai</FieldLabel>
              <Input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Selesai</FieldLabel>
              <Input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Opsional. Dikosongkan berarti event berakhir di penghujung hari
                mulai.
              </p>
            </Field>
          </div>
          <EventAudienceField
            value={audience}
            onChange={setAudience}
            divisions={catalog.divisions}
            roles={catalog.roles}
            divisionCounts={catalog.divisionCounts}
            roleCounts={catalog.roleCounts}
            activeMemberCount={catalog.memberCount}
          />
          <Field className="flex flex-row items-center justify-between gap-3">
            <FieldLabel>Izinkan perizinan</FieldLabel>
            <Switch
              checked={form.allow_permission}
              onCheckedChange={(checked) =>
                setForm({ ...form, allow_permission: !!checked })
              }
            />
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(next) => {
          if (!next) setDeleting(null)
        }}
        title="Hapus Event"
        description={`Apakah Anda yakin ingin menghapus event "${deleting?.title}"?`}
        onConfirm={handleDelete}
      />
    </AdvancedResourcePage>
  )
}
