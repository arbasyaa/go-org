import { DashboardView } from "@/components/member/dashboard-view"
import { unwrapList } from "@/lib/format"
import { serverGet } from "@/lib/server-api"
import type {
  Announcement,
  Division,
  Event,
  PermissionRequest,
  User,
  Violation,
} from "@/lib/types"

/**
 * Server Component: data dashboard diambil di server (cookie user) lalu
 * dikirim ke client, jadi kalender & kartu sudah tampil di HTML pertama —
 * tanpa skeleton saat hard refresh. Permintaan berjalan paralel.
 */
export default async function DashboardPage() {
  const [events, divisions, announcements, permissions, violations, me] =
    await Promise.all([
      serverGet<Event[] | { items: Event[] }>("/events"),
      serverGet<Division[] | { items: Division[] }>("/divisions"),
      serverGet<Announcement[] | { items: Announcement[] }>("/announcements"),
      serverGet<PermissionRequest[] | { items: PermissionRequest[] }>(
        "/permission_requests/me"
      ),
      serverGet<Violation[] | { items: Violation[] }>("/violations/me"),
      serverGet<User>("/me"),
    ])

  return (
    <DashboardView
      events={unwrapList(events)}
      divisions={unwrapList(divisions)}
      announcements={unwrapList(announcements).slice(0, 4)}
      pendingPermissions={unwrapList(permissions)
        .filter((item) => item.status === "pending")
        .slice(0, 3)}
      violations={unwrapList(violations)}
      myDivisionId={me?.division_id}
      failed={!events}
    />
  )
}
