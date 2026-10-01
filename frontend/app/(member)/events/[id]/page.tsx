"use client"

import Link from "next/link"
import { use, useState } from "react"
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
} from "lucide-react"
import { IzinRequestDialog } from "@/components/member/izin-request-dialog"
import { FEATURES } from "@/lib/features"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingState } from "@/components/page-states"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatDate } from "@/lib/format"
import { eventBannerUrl } from "@/lib/event-banner"
import {
  isPermissionClosed,
  permissionDeadlineLabel,
} from "@/lib/permission-deadline"
import { FADE_IN } from "@/lib/motion"
import { EventAudienceBadge, eventOrganizerName } from "@/lib/event-audience"
import type { Event } from "@/lib/types"

const ATTENDANCE_LABELS: Record<string, string> = {
  present: "Hadir",
  permitted: "Izin disetujui",
  absent: "Tidak hadir",
  rejected: "Izin ditolak",
}

const PERMISSION_LABELS: Record<string, string> = {
  pending: "Menunggu persetujuan",
  approved: "Disetujui",
  rejected: "Ditolak",
}

import { EventJoinButton } from "@/lib/event-audience"

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: event, loading, error, refetch } = useApi(
    () => apiRequest<Event>(`/events/${id}`),
    [id]
  )
  const [izinOpen, setIzinOpen] = useState(false)
  const banner = event ? eventBannerUrl(event) : null
  const organizer = event ? eventOrganizerName(event) : null

  // `present`/`permitted` = sudah tercatat dan terkunci. `rejected` bukan:
  // izin yang ditolak boleh diajukan ulang (aturan yang sama ditegakkan
  // backend di AttendanceService.Submit & PermissionRequestService.Create).
  const attendanceStatus = event?.my_attendance_status
  const hasAttendance = attendanceStatus === "present" || attendanceStatus === "permitted"
  // Absensi mandiri dimatikan sementara (lib/features.ts) — tombolnya hilang,
  // alur izin tetap jalan.
  const canAttend =
    FEATURES.attendance &&
    event?.status === "ongoing" &&
    !hasAttendance &&
    event?.is_participant !== false
  const izinClosed = isPermissionClosed(event?.start_time)
  // Syarat dasar pengajuan izin; batas H-3 jam dicek terpisah supaya tombolnya
  // bisa tampil nonaktif dengan alasan, bukan menghilang begitu saja.
  const izinAvailable =
    Boolean(event?.allow_permission) &&
    event?.is_participant !== false &&
    !hasAttendance &&
    (event?.status === "upcoming" || event?.status === "ongoing") &&
    event?.my_permission_request_status !== "pending" &&
    event?.my_permission_request_status !== "approved"

  return (
    <>
      <PageHeader
        title={event?.title ?? "Detail Event"}
        crumbs={[
          { label: "Event", href: "/events" },
          { label: event?.title ?? "Detail" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href="/events" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Kembali ke daftar event
        </Button>

        {loading ? <LoadingState rows={4} /> : null}
        {error ? <ErrorState message={error} /> : null}

        {event ? (
          <article className={`${FADE_IN} overflow-hidden rounded-2xl border bg-card`}>
            <div className="relative aspect-[21/9] bg-muted sm:aspect-[2.5/1]">
              {banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={banner}
                  alt={event.title}
                  decoding="async"
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <CalendarIcon className="size-12 opacity-30" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-semibold">
                    {event.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.location || "Lokasi belum diisi"}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <EventAudienceBadge event={event} />
                {organizer ? (
                  <span className="text-xs text-muted-foreground">
                    Penyelenggara: {organizer}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="size-4" />
                    Mulai
                  </p>
                  <p className="mt-1 font-medium">
                    {formatDate(event.start_time)}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="size-4" />
                    Selesai
                  </p>
                  <p className="mt-1 font-medium">{formatDate(event.end_time)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm sm:col-span-2">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MapPinIcon className="size-4" />
                    Lokasi
                  </p>
                  <p className="mt-1 font-medium">
                    {event.location || "Belum ditentukan"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium">Deskripsi</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {event.description || "Tidak ada deskripsi untuk event ini."}
                </p>
              </div>

              {event.link_url ? <EventJoinButton event={event} /> : null}

              {FEATURES.attendance || event.my_permission_request_status ? (
                <div className="rounded-xl border px-4 py-3 text-sm">
                  <p className="text-muted-foreground">
                    {FEATURES.attendance
                      ? "Status absensi Anda"
                      : "Status pengajuan izin"}
                  </p>
                  <p className="mt-1 font-medium">
                    {FEATURES.attendance
                      ? event.my_attendance_status
                        ? (ATTENDANCE_LABELS[event.my_attendance_status] ??
                          event.my_attendance_status)
                        : "Belum absen"
                      : (PERMISSION_LABELS[
                          event.my_permission_request_status ?? ""
                        ] ?? event.my_permission_request_status)}
                  </p>
                  {FEATURES.attendance &&
                  event.my_permission_request_status ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pengajuan izin:{" "}
                      {PERMISSION_LABELS[event.my_permission_request_status] ??
                        event.my_permission_request_status}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {canAttend || izinAvailable ? (
                <div className="flex flex-wrap gap-2">
                  {canAttend ? (
                    <Button
                      className="w-full sm:w-auto"
                      render={<Link href={`/events/${event.id}/attendance`} />}
                    >
                      Absen sekarang
                    </Button>
                  ) : null}
                  {izinAvailable ? (
                    <>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        disabled={izinClosed}
                        onClick={() => setIzinOpen(true)}
                      >
                        Ajukan Izin
                      </Button>
                      {izinClosed ? (
                        <p className="w-full text-xs text-muted-foreground">
                          Pengajuan izin ditutup sejak{" "}
                          {permissionDeadlineLabel(event.start_time)} — izin
                          hanya bisa diajukan maksimal 3 jam sebelum event
                          mulai.
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        ) : null}
      </div>

      <IzinRequestDialog
        eventId={Number(id)}
        eventStartTime={event?.start_time}
        open={izinOpen}
        onOpenChange={setIzinOpen}
        onSuccess={() => void refetch()}
      />
    </>
  )
}
