"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import {
  EventAudienceField,
  type EventAudienceValue,
} from "@/components/event-audience-field"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/api"
import { endOfDayInput, toLocalInput, toRFC3339 } from "@/lib/datetime"
import { useAudienceCatalog } from "@/hooks/use-audience-catalog"
import type { Event } from "@/lib/types"

/** Form event dipakai untuk create dan edit — cakupan selalu dikirim lengkap. */
export function EventForm({
  event,
  initialAudience,
}: {
  event?: Event
  initialAudience?: Partial<EventAudienceValue>
}) {
  const router = useRouter()
  const catalog = useAudienceCatalog()
  const [audience, setAudience] = useState<EventAudienceValue>({
    audience: initialAudience?.audience ?? "custom",
    divisionIds: initialAudience?.divisionIds ?? [],
    roleIds: initialAudience?.roleIds ?? [],
  })
  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    location: event?.location ?? "",
    link_url: event?.link_url ?? "",
    start_time: toLocalInput(event?.start_time),
    end_time: toLocalInput(event?.end_time),
    allow_permission: event?.allow_permission ?? true,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        start_time: toRFC3339(form.start_time),
        end_time: toRFC3339(form.end_time || endOfDayInput(form.start_time)),
        audience: audience.audience,
        target_division_ids: audience.divisionIds,
        target_role_ids: audience.roleIds,
      }
      if (event) {
        await apiRequest(`/events/${event.id}`, { method: "PUT", body })
        toast.success("Event diperbarui")
      } else {
        await apiRequest("/events", { method: "POST", body })
        toast.success("Event dibuat")
      }
      router.push("/admin/events")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan event")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title={event ? "Edit Event" : "Buat Event"}
        crumbs={[
          { label: "Event", href: "/admin/events" },
          { label: event ? "Edit" : "Buat" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Detail Kegiatan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Nama Event</FieldLabel>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Link Event</FieldLabel>
                    <Input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={form.link_url}
                      onChange={(e) =>
                        setForm({ ...form, link_url: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Lokasi</FieldLabel>
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Tanggal & Waktu Mulai</FieldLabel>
                    <Input
                      type="datetime-local"
                      value={form.start_time}
                      onChange={(e) =>
                        setForm({ ...form, start_time: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Tanggal & Waktu Selesai</FieldLabel>
                    <Input
                      type="datetime-local"
                      value={form.end_time}
                      onChange={(e) =>
                        setForm({ ...form, end_time: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Opsional. Dikosongkan berarti event berakhir di penghujung
                      hari mulai.
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

                <Field className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FieldLabel>Izinkan Perizinan</FieldLabel>
                  <Switch
                    checked={form.allow_permission}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, allow_permission: checked })
                    }
                  />
                </Field>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button variant="outline" render={<Link href="/admin/events" />}>
                    Batal
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
