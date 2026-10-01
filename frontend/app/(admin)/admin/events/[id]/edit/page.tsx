import { notFound } from "next/navigation"
import { EventForm } from "@/components/event-form"
import { serverGet } from "@/lib/server-api"
import type { Event } from "@/lib/types"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // serverGet mengirim cookie `token` milik user. apiRequest tidak bisa dipakai
  // di Server Component: token-nya hanya ada di browser, jadi backend menjawab
  // 401 dan halaman ini selalu 404.
  const event = await serverGet<Event>(`/events/${id}`)
  if (!event) notFound()

  return (
    <EventForm
      event={event}
      initialAudience={{
        audience: event.audience === "all" ? "all" : "custom",
        divisionIds: event.target_division_ids ?? [],
        roleIds: event.target_role_ids ?? [],
      }}
    />
  )
}
