import { notFound } from "next/navigation"
import { EventForm } from "@/components/event-form"
import { apiRequest } from "@/lib/api"
import type { Event } from "@/lib/types"

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let event: Event
  try {
    event = await apiRequest<Event>(`/events/${id}`)
  } catch {
    notFound()
  }

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
