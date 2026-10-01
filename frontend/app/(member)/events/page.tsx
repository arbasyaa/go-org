import { EventsView } from "@/components/member/events-view"
import { unwrapList } from "@/lib/format"
import { serverGet } from "@/lib/server-api"
import type { Division, Event, User } from "@/lib/types"

/**
 * Server Component: daftar event + divisi diambil di server (cookie user) lalu
 * diteruskan ke client, jadi kartu/kalender sudah tampil di HTML pertama.
 */
export default async function EventsPage() {
  const [events, divisions, me] = await Promise.all([
    serverGet<Event[] | { items: Event[] }>("/events"),
    serverGet<Division[] | { items: Division[] }>("/divisions"),
    serverGet<User>("/me"),
  ])

  return (
    <EventsView
      events={unwrapList(events)}
      divisions={unwrapList(divisions)}
      myDivisionId={me?.division_id}
      failed={!events}
    />
  )
}
