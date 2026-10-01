"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  CalendarIcon,
  ClipboardListIcon,
  MegaphoneIcon,
  ShieldAlertIcon,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState } from "@/components/page-states"
import { ScheduleCalendar } from "@/components/member/schedule-calendar"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import { FADE_IN, fadeInDelay } from "@/lib/motion"
import type {
  Announcement,
  Division,
  Event,
  PermissionRequest,
  Violation,
} from "@/lib/types"

/**
 * Isi dashboard anggota. Datanya sudah diambil Server Component
 * (`app/(member)/dashboard/page.tsx`) supaya kalender langsung ada di HTML
 * pertama — sebelumnya semuanya fetch dari client sehingga skeleton muncul
 * lebih dulu di tiap hard refresh.
 */
export function DashboardView({
  events,
  divisions,
  announcements,
  pendingPermissions,
  violations,
  myDivisionId,
  failed,
}: {
  events: Event[]
  divisions: Division[]
  announcements: Announcement[]
  pendingPermissions: PermissionRequest[]
  violations: Violation[]
  /** Divisi user untuk penanda legend, sudah diketahui di server. */
  myDivisionId?: number | null
  /** true kalau fetch server gagal (backend sedang tidak bisa dihubungi). */
  failed?: boolean
}) {
  const spCount = violations.filter((v) => v.sp_level).length
  const upcoming = events
    .filter((e) => e.status === "upcoming" || e.status === "ongoing")
    .slice(0, 4)

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        {spCount > 0 ? (
          <Alert variant="destructive">
            <ShieldAlertIcon />
            <AlertTitle>
              Anda memiliki {spCount} surat peringatan (SP) aktif
            </AlertTitle>
            <AlertDescription>
              <Link href="/my-violations" className="underline">
                Lihat detail pelanggaran Anda
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        {failed ? (
          <ErrorState message="Gagal memuat data dashboard. Muat ulang halaman untuk mencoba lagi." />
        ) : (
          <div className={FADE_IN}>
            <ScheduleCalendar
              events={events}
              divisions={divisions}
              myDivisionId={myDivisionId}
            />
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          {/* stagger: kartu masuk berurutan, satu gerakan per halaman */}
          <Card className={`${FADE_IN} lg:col-span-2`} style={fadeInDelay(1)}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon />
                  Event mendatang
                </CardTitle>
                <CardDescription>
                  Ringkasan kegiatan yang perlu Anda ikuti
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" render={<Link href="/events" />}>
                Semua
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {upcoming.length === 0 ? (
                <EmptyState message="Belum ada event mendatang" />
              ) : (
                upcoming.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.start_time)}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={event.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className={FADE_IN} style={fadeInDelay(2)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardListIcon />
                  Perizinan pending
                </CardTitle>
                <CardDescription>Menunggu keputusan admin</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {pendingPermissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada pengajuan pending
                  </p>
                ) : null}
                {pendingPermissions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    <p className="font-medium">
                      {item.event?.title ?? `Event #${item.event_id}`}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {item.reason ?? "Tanpa alasan"}
                    </p>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  render={<Link href="/my-permissions" />}
                >
                  Lihat perizinan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MegaphoneIcon />
                    Pengumuman
                  </CardTitle>
                  <CardDescription>Info terbaru organisasi</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/announcements" />}
                >
                  Semua
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {announcements.length === 0 ? (
                  <EmptyState message="Belum ada pengumuman" />
                ) : null}
                {announcements.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.content}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
