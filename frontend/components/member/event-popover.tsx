"use client"

import Link from "next/link"
import { CalendarClockIcon, MapPinIcon } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  divisionName,
  eventWhenLabel,
  STATUS_LABEL,
  type Range,
} from "@/components/member/calendar-utils"

/**
 * Chip/blok event yang membuka ringkasan kecil (judul, waktu, divisi, lokasi)
 * dan tautan ke halaman detail, alih-alih langsung berpindah halaman.
 */
export function EventPopover({
  range,
  color,
  className,
  style,
  children,
  side,
  align = "start",
}: {
  range: Range
  color: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
}) {
  const { event } = range
  return (
    <Popover>
      <PopoverTrigger
        title={`${event.title} · ${divisionName(event)} · ${STATUS_LABEL[event.status] ?? event.status}`}
        className={className}
        style={style}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-72">
        <div className="flex items-start gap-2">
          <span
            aria-hidden
            className="mt-1.5 size-3 shrink-0 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <PopoverTitle className="min-w-0 flex-1 text-balance break-words">
            {event.title}
          </PopoverTitle>
          <StatusBadge status={event.status} />
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <CalendarClockIcon className="mt-0.5 size-3.5 shrink-0" />
            <span>{eventWhenLabel(range)}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="ml-0.5 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            {divisionName(event)}
          </p>
          {event.location ? (
            <p className="flex items-start gap-1.5">
              <MapPinIcon className="mt-0.5 size-3.5 shrink-0" />
              <span className="break-words">{event.location}</span>
            </p>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`/events/${event.id}`} />}
        >
          Lihat detail
        </Button>
      </PopoverContent>
    </Popover>
  )
}
