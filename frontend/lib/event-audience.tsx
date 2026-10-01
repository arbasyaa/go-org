"use client"

import { LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Event } from "@/lib/types"

/** Satu baris ringkasan cakupan: "Semua anggota" atau "Divisi PH, PSDM · Role PH". */
export function eventAudienceLabel(event: Event) {
  if (event.audience === "all") return "Semua anggota"
  const parts: string[] = []
  if (event.target_division_names?.length) {
    parts.push(`Divisi ${event.target_division_names.join(", ")}`)
  }
  if (event.target_role_names?.length) {
    parts.push(`Role ${event.target_role_names.join(", ")}`)
  }
  return parts.length ? parts.join(" · ") : "Belum ada peserta"
}

/** Nama divisi penyelenggara event, null kalau tidak ditentukan. */
export function eventOrganizerName(event: Event) {
  if (!event.division) return null
  return typeof event.division === "string" ? event.division : event.division.name
}

export function EventAudienceBadge({
  event,
  className,
}: {
  event: Event
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground",
        className
      )}
    >
      {eventAudienceLabel(event)}
    </span>
  )
}

/** Tombol "Gabung Meeting" — hanya muncul kalau event punya link eksternal. */
export function EventJoinButton({ event }: { event: Event }) {
  if (!event.link_url) return null
  return (
    <Button
      className="w-fit"
      render={
        <a href={event.link_url} target="_blank" rel="noopener noreferrer" />
      }
    >
      <LinkIcon data-icon="inline-start" />
      Gabung Meeting
    </Button>
  )
}
