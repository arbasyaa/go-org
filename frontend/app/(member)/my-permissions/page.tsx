"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CalendarIcon, ClipboardListIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/page-states"
import { StatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatDate, unwrapList } from "@/lib/format"
import { FADE_IN, fadeInDelay } from "@/lib/motion"
import { storageUrl } from "@/lib/storage-url"
import type { PermissionRequest } from "@/lib/types"

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Disetujui" },
  { id: "rejected", label: "Ditolak" },
] as const

export default function MyPermissionsPage() {
  const { data, loading, error } = useApi(async () => {
    const result = await apiRequest<
      PermissionRequest[] | { items: PermissionRequest[] }
    >("/permission_requests/me")
    return unwrapList(result)
  })
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["id"]>("all")

  const rows = useMemo(() => data ?? [], [data])
  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    }),
    [rows]
  )

  const filtered = useMemo(
    () =>
      rows
        .filter((item) => (filter === "all" ? true : item.status === filter))
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        ),
    [rows, filter]
  )

  return (
    <>
      <PageHeader
        title="Perizinan Saya"
        crumbs={[{ label: "Perizinan Saya" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-4">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={
                filter === item.id
                  ? "rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-left"
                  : "rounded-2xl border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
              }
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {counts[item.id]}
              </p>
            </button>
          ))}
        </div>

        {loading ? <LoadingState rows={4} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {!loading && !error && filtered.length === 0 ? (
          <EmptyState message="Belum ada pengajuan perizinan" />
        ) : null}

        <div className="flex flex-col gap-3">
          {filtered.map((item, index) => (
            <article
              key={item.id}
              style={fadeInDelay(index)}
              className={`${FADE_IN} overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/30`}
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {item.category?.name ?? "Tanpa kategori"}
                    </Badge>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 className="mt-2 font-heading text-base font-medium">
                    {item.event?.title ?? `Event #${item.event_id}`}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {item.event?.start_time ? (
                      <span className="flex items-center gap-1.5">
                        <CalendarIcon className="size-3.5" />
                        Event {formatDate(item.event.start_time)}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1.5">
                      <ClipboardListIcon className="size-3.5" />
                      Diajukan {formatDate(item.created_at)}
                    </span>
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.reason?.trim() || "Tanpa keterangan"}
                  </p>
                  {item.review_note ? (
                    <p className="mt-2 rounded-xl bg-muted/50 px-3 py-2 text-xs">
                      Catatan admin: {item.review_note}
                    </p>
                  ) : null}
                </div>
                {item.proof_url ? (
                  <a
                    href={storageUrl(item.proof_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Lihat bukti gambar"
                    className="group relative size-24 shrink-0 overflow-hidden rounded-xl border bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:size-28"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={storageUrl(item.proof_url)}
                      alt="Bukti gambar pengajuan izin"
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-foreground/70 py-1 text-center text-xs text-background">
                      Lihat
                    </span>
                  </a>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  Pengajuan #{item.id}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/events/${item.event_id}`} />}
                >
                  Buka event
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
