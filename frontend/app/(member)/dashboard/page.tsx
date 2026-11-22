import { PortalDashboard } from "@/components/dashboard/portal-dashboard"
import { unwrapList } from "@/lib/format"
import { serverGet } from "@/lib/server-api"
import type {
  Announcement,
  Division,
  Event,
  PermissionRequest,
  Violation,
} from "@/lib/types"

/**
 * Server Component: data personal dashboard diambil di server (cookie user)
 * lalu dikirim ke client, jadi kartu sudah tampil di HTML pertama — tanpa
 * skeleton saat hard refresh. Data pengelolaan (admin) diambil di client
 * hanya untuk permission yang dimiliki (lihat PortalDashboard).
 */
export default async function DashboardPage() {
  const [events, divisions, announcements, permissions, violations] = await Promise.all([
    serverGet<Event[] | { items: Event[] }>("/events"),
    serverGet<Division[] | { items: Division[] }>("/divisions"),
    serverGet<Announcement[] | { items: Announcement[] }>("/announcements"),
    serverGet<PermissionRequest[] | { items: PermissionRequest[] }>(
      "/permission_requests/me"
    ),
    serverGet<Violation[] | { items: Violation[] }>("/violations/me"),
  ])

  return (
    <PortalDashboard
      events={unwrapList(events)}
      divisions={unwrapList(divisions)}
      announcements={unwrapList(announcements)}
      myPendingPermissions={unwrapList(permissions)
        .filter((item) => item.status === "pending")
        .slice(0, 3)}
      violations={unwrapList(violations)}
      failed={!events}
    />
  )
}
