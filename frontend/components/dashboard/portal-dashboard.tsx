"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useMemo, type ReactNode } from "react"
import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  ClipboardListIcon,
  MailIcon,
  MegaphoneIcon,
  ShieldAlertIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react"
import { ScheduleCalendar } from "@/components/member/schedule-calendar"
import { PageHeader } from "@/components/page-header"
import { EmptyState, ErrorState } from "@/components/page-states"
import { useAuth } from "@/components/providers/auth-provider"
import { StatusBadge } from "@/components/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { FEATURES } from "@/lib/features"
import {
  formatCurrency,
  formatDate,
  formatDateOnly,
  unwrapList,
} from "@/lib/format"
import { FADE_IN, fadeInDelay } from "@/lib/motion"
import type {
  Announcement,
  Division,
  Event,
  FinanceDashboard,
  Letter,
  PermissionRequest,
  User,
  Violation,
} from "@/lib/types"

type StatCard = {
  label: string
  value: number | string
  hint?: string
  href: string
  icon: ReactNode
  show: boolean
}

const eventChartConfig = {
  count: { label: "Event", color: "var(--primary)" },
} satisfies ChartConfig

// recharts (±100 KB) menyusul setelah halaman tampil, bukan bagian bundle awal.
const EventStatusChart = dynamic(
  () =>
    import("@/components/admin/event-status-chart").then(
      (mod) => mod.EventStatusChart
    ),
  { ssr: false, loading: () => <Skeleton className="h-56 w-full" /> }
)

function labelOf(value: string | { name: string } | null | undefined) {
  if (!value) return ""
  return typeof value === "string" ? value : value.name
}

/**
 * Dashboard tunggal Portal Pengurus. Data personal (event, pengumuman, izin
 * & pelanggaran sendiri) diambil Server Component `app/(member)/dashboard`;
 * data pengelolaan diambil di sini, hanya untuk permission yang dimiliki.
 * Kartu tanpa permission tidak dirender sama sekali.
 */
export function PortalDashboard({
  events,
  divisions = [],
  announcements,
  myPendingPermissions,
  violations,
  failed,
}: {
  events: Event[]
  /** Daftar divisi untuk warna & legend kalender. */
  divisions?: Division[]
  announcements: Announcement[]
  myPendingPermissions: PermissionRequest[]
  violations: Violation[]
  /** true kalau fetch server gagal (backend sedang tidak bisa dihubungi). */
  failed?: boolean
}) {
  const { user, hasPermission } = useAuth()

  const canUsers = hasPermission("users.view")
  const canEvents = hasPermission("events.view")
  const canCreateEvent = hasPermission("events.create")
  const canSubmitPermission = hasPermission("permission.submit")
  const canApprove = hasPermission([
    "attendance.approve",
    "attendance.approve_own",
  ])
  const canViolations = hasPermission("violations.view")
  const canLetters = hasPermission("letters.view")
  const canAnnouncements = hasPermission("announcement.create")
  const canFinance = FEATURES.finance && hasPermission("finance.view")

  const users = useApi(async () => {
    if (!canUsers) return [] as User[]
    return apiRequest<User[] | { items: User[] }>("/users").then(unwrapList)
  }, [canUsers])

  const approvals = useApi(async () => {
    if (!canApprove) return [] as PermissionRequest[]
    return apiRequest<PermissionRequest[] | { items: PermissionRequest[] }>(
      "/attendance/permission_requests"
    ).then(unwrapList)
  }, [canApprove])

  const violationList = useApi(async () => {
    if (!canViolations) return [] as Violation[]
    return apiRequest<Violation[] | { items: Violation[] }>(
      "/violations"
    ).then(unwrapList)
  }, [canViolations])

  const letters = useApi(async () => {
    if (!canLetters) return [] as Letter[]
    return apiRequest<Letter[] | { items: Letter[] }>("/letters").then(
      unwrapList
    )
  }, [canLetters])

  const finance = useApi(async () => {
    if (!canFinance) return null
    return apiRequest<FinanceDashboard>("/finance_transactions/dashboard")
  }, [canFinance])

  const statsLoading =
    (canUsers && users.loading) ||
    (canApprove && approvals.loading) ||
    (canViolations && violationList.loading) ||
    (canLetters && letters.loading) ||
    (canFinance && finance.loading)

  const firstError =
    users.error ||
    approvals.error ||
    violationList.error ||
    letters.error ||
    finance.error

  const userRows = users.data ?? []
  const approvalRows = useMemo(() => approvals.data ?? [], [approvals.data])
  const violationRows = violationList.data ?? []
  const letterRows = letters.data ?? []
  const financeSummary = finance.data?.summary

  const pendingApprovals = useMemo(
    () => approvalRows.filter((p) => p.status === "pending"),
    [approvalRows]
  )

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => e.status === "upcoming" || e.status === "ongoing")
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
        .slice(0, 5),
    [events]
  )

  const eventChartData = useMemo(
    () => [
      {
        status: "Mendatang",
        count: events.filter((e) => e.status === "upcoming").length,
      },
      {
        status: "Berlangsung",
        count: events.filter((e) => e.status === "ongoing").length,
      },
      {
        status: "Selesai",
        count: events.filter((e) => e.status === "finished").length,
      },
    ],
    [events]
  )

  const spCount = violations.filter((v) => v.sp_level).length
  const latestAnnouncements = announcements.slice(0, 4)

  const quickActions = [
    { label: "Ajukan izin", href: "/my-permissions", show: canSubmitPermission },
    { label: "Buat event", href: "/admin/events", show: canCreateEvent },
    {
      label: "Approval perizinan",
      href: "/admin/permissions",
      show: canApprove,
    },
    {
      label: "Buat pengumuman",
      href: "/admin/announcements",
      show: canAnnouncements,
    },
    { label: "Tambah pengguna", href: "/admin/users", show: canUsers },
    { label: "Surat", href: "/admin/letters/incoming", show: canLetters },
    { label: "Keuangan", href: "/admin/finance", show: canFinance },
  ].filter((a) => a.show)

  const stats: StatCard[] = [
    {
      label: "Pengguna",
      value: userRows.length,
      hint: `${userRows.filter((u) => u.status === "active").length} aktif`,
      href: "/admin/users",
      icon: <UsersIcon />,
      show: canUsers,
    },
    {
      label: "Event",
      value: events.length,
      hint: `${events.filter((e) => e.status === "ongoing").length} berlangsung`,
      href: "/admin/events",
      icon: <CalendarIcon />,
      show: canCreateEvent,
    },
    {
      label: "Perizinan pending",
      value: pendingApprovals.length,
      hint: `${approvalRows.length} total pengajuan`,
      href: "/admin/permissions",
      icon: <BellIcon />,
      show: canApprove,
    },
    {
      label: "Pelanggaran",
      value: violationRows.length,
      href: "/admin/violations",
      icon: <ClipboardListIcon />,
      show: canViolations,
    },
    {
      label: "Surat",
      value: letterRows.length,
      hint: `${letterRows.filter((l) => l.type === "incoming").length} masuk · ${letterRows.filter((l) => l.type === "outgoing").length} keluar`,
      href: "/admin/letters/incoming",
      icon: <MailIcon />,
      show: canLetters,
    },
    {
      label: "Pengumuman",
      value: announcements.length,
      href: "/admin/announcements",
      icon: <MegaphoneIcon />,
      show: canAnnouncements,
    },
    {
      label: "Saldo keuangan",
      value: formatCurrency(financeSummary?.balance ?? 0),
      hint: `Masuk ${formatCurrency(financeSummary?.total_income ?? financeSummary?.income ?? 0)}`,
      href: "/admin/finance",
      icon: <WalletIcon />,
      show: canFinance,
    },
  ].filter((s) => s.show)

  const subtitle = [labelOf(user?.role), labelOf(user?.division)]
    .filter(Boolean)
    .join(" · ")

  return (
    <>
      <PageHeader title="Dashboard" crumbs={[{ label: "Dashboard" }]} />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <div className={FADE_IN}>
          <p className="text-2xl font-semibold">
            Halo, {user?.full_name || user?.username || "Pengurus"}
          </p>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

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
        ) : null}
        {firstError ? <ErrorState message={firstError} /> : null}

        {quickActions.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Aksi cepat
            </h2>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Button
                  key={action.href + action.label}
                  variant="outline"
                  size="sm"
                  render={<Link href={action.href} />}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </section>
        ) : null}

        {stats.length > 0 ? (
          statsLoading ? (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map((stat) => (
                <Skeleton key={stat.label} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="block">
                  <Card
                    size="sm"
                    className="h-full transition-colors hover:bg-muted/30"
                  >
                    <CardContent className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                          {stat.value}
                        </p>
                        {stat.hint ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {stat.hint}
                          </p>
                        ) : null}
                      </div>
                      <div className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex [&_svg]:size-4">
                        {stat.icon}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        ) : null}

        {canEvents ? (
          <section aria-label="Kalender jadwal" className={FADE_IN}>
            <ScheduleCalendar
              events={events}
              divisions={divisions}
              myDivisionId={user?.division_id}
            />
          </section>
        ) : null}

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            {canApprove ? (
              <Card className={FADE_IN} style={fadeInDelay(1)}>
                <CardHeader>
                  <CardTitle>Perlu tindakan</CardTitle>
                  <CardDescription>
                    Pengajuan izin menunggu approval
                  </CardDescription>
                  <CardAction>
                    <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/admin/permissions" />}
                  >
                    Semua
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {approvals.loading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : pendingApprovals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada pengajuan pending
                    </p>
                  ) : (
                    pendingApprovals.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 rounded-xl border p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {item.user?.full_name ?? `User #${item.user_id}`}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.event?.title ?? `Event #${item.event_id}`}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {item.reason || "Tanpa alasan"}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className={FADE_IN} style={fadeInDelay(2)}>
              <CardHeader>
                <CardTitle>Event mendatang</CardTitle>
                <CardDescription>
                  Kegiatan yang akan dan sedang berlangsung
                </CardDescription>
                <CardAction>
                  <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/events" />}
                >
                  Semua
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {upcomingEvents.length === 0 ? (
                  <EmptyState message="Belum ada event mendatang" />
                ) : (
                  upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.all_day
                            ? formatDateOnly(event.start_time)
                            : formatDate(event.start_time)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={event.status} />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card className={FADE_IN} style={fadeInDelay(1)}>
              <CardHeader>
                <CardTitle>Pengumuman terbaru</CardTitle>
                <CardDescription>Info terbaru organisasi</CardDescription>
                <CardAction>
                  <Button
                  variant="ghost"
                  size="sm"
                  render={<Link href="/announcements" />}
                >
                  Semua
                </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {latestAnnouncements.length === 0 ? (
                  <EmptyState message="Belum ada pengumuman" />
                ) : null}
                {latestAnnouncements.map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.content}
                    </p>
                    {item.created_at ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            {canSubmitPermission ? (
              <Card className={FADE_IN} style={fadeInDelay(2)}>
                <CardHeader>
                  <CardTitle>Perizinan saya</CardTitle>
                  <CardDescription>Pengajuan yang menunggu keputusan</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {myPendingPermissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Tidak ada pengajuan pending
                    </p>
                  ) : null}
                  {myPendingPermissions.map((item) => (
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
            ) : null}

            {canEvents ? (
              <Card className={FADE_IN} style={fadeInDelay(3)}>
                <CardHeader>
                  <CardTitle>Status event</CardTitle>
                  <CardDescription>
                    Sebaran event berdasarkan status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EventStatusChart
                    data={eventChartData}
                    config={eventChartConfig}
                  />
                </CardContent>
              </Card>
            ) : null}

            {canFinance ? (
              <Card className={FADE_IN} style={fadeInDelay(4)}>
                <CardHeader>
                  <CardTitle>Ringkasan keuangan</CardTitle>
                  <CardDescription>
                    Snapshot pemasukan dan pengeluaran
                  </CardDescription>
                  <CardAction>
                    <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/admin/finance" />}
                  >
                    Detail
                  </Button>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-muted/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Pemasukan</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {formatCurrency(
                        financeSummary?.total_income ??
                          financeSummary?.income ??
                          0
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Pengeluaran</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {formatCurrency(
                        financeSummary?.total_expense ??
                          financeSummary?.expense ??
                          0
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 px-4 py-3">
                    <p className="text-xs text-muted-foreground">Total Saldo</p>
                    <p className="mt-1 font-semibold tabular-nums">
                      {formatCurrency(financeSummary?.balance ?? 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
