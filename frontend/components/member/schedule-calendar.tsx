"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from "lucide-react"
import { StatusBadge } from "@/components/status-badge"
import { DivisionLegend } from "@/components/member/division-legend"
import { Button } from "@/components/ui/button"
import {
  creatorDivisionLabel,
  divisionColorMap,
  NO_DIVISION_COLOR,
} from "@/lib/division-color"
import { cn } from "@/lib/utils"
import type { Division, Event } from "@/lib/types"

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

/** Baris chip maksimal per hari. Sisa event diringkas jadi "+N lagi". */
const MAX_LANES = 3
const CELL_HEIGHT = 144
const LANE_TOP = 32
const LANE_STEP = 24
const BAR_HEIGHT = 22

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Mendatang",
  ongoing: "Berlangsung",
  finished: "Selesai",
  cancelled: "Dibatalkan",
}

const STATUS_DOT: Record<string, string> = {
  ongoing: "bg-primary",
  upcoming: "bg-muted-foreground/70",
  finished: "bg-muted-foreground/40",
  cancelled: "bg-destructive",
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

function daysBetween(a: Date, b: Date) {
  // Pembulatan aman terhadap pergantian DST (hari bisa 23/25 jam).
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(d)
}

function dayLabel(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d)
}

function timeLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return ""
  }
}

function divisionName(event: Event) {
  return creatorDivisionLabel(
    event.created_by_division_name,
    event.created_by_division_id
  )
}

type Range = { event: Event; start: Date; end: Date }
type Segment = {
  range: Range
  col: number
  span: number
  lane: number
  openStart: boolean
  openEnd: boolean
}

function isMidnight(d: Date) {
  return (
    d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
  )
}

/**
 * Rentang hari event, inklusif di kedua ujung. Event yang selesai tepat tengah
 * malam (00:00) tidak menambah satu hari — sama seperti Google Calendar.
 */
function toRange(event: Event): Range | null {
  const start = startOfDay(new Date(event.start_time))
  if (Number.isNaN(start.getTime())) return null
  const rawEnd = event.end_time ? new Date(event.end_time) : null
  if (!rawEnd || Number.isNaN(rawEnd.getTime())) {
    return { event, start, end: start }
  }
  const end = isMidnight(rawEnd)
    ? addDays(startOfDay(rawEnd), -1)
    : startOfDay(rawEnd)
  return { event, start, end: end < start ? start : end }
}

function buildWeeks(viewMonth: Date) {
  const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
  const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0)
  let cursor = addDays(first, -((first.getDay() + 6) % 7))
  const cells = ((first.getDay() + 6) % 7) + last.getDate()
  const weeks: Date[][] = []
  for (let w = 0; w < Math.ceil(cells / 7); w++) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }
  return weeks
}

/** Potong event ke satu minggu, lalu susun ke baris (lane) tanpa saling tumpuk. */
function layoutWeek(week: Date[], ranges: Range[]) {
  const weekStart = week[0]
  const weekEnd = week[6]
  const candidates: Omit<Segment, "lane">[] = []
  for (const range of ranges) {
    if (range.end < weekStart || range.start > weekEnd) continue
    const from = range.start < weekStart ? weekStart : range.start
    const to = range.end > weekEnd ? weekEnd : range.end
    candidates.push({
      range,
      col: daysBetween(weekStart, from),
      span: daysBetween(from, to) + 1,
      openStart: range.start < weekStart,
      openEnd: range.end > weekEnd,
    })
  }
  candidates.sort(
    (a, b) =>
      a.col - b.col ||
      b.span - a.span ||
      a.range.event.title.localeCompare(b.range.event.title)
  )

  const laneEnds: number[] = []
  const segments: Segment[] = []
  for (const candidate of candidates) {
    let lane = laneEnds.findIndex((lastCol) => lastCol < candidate.col)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(candidate.col)
    }
    laneEnds[lane] = candidate.col + candidate.span - 1
    segments.push({ ...candidate, lane })
  }
  return segments
}

function hiddenPerColumn(segments: Segment[]) {
  const hidden = [0, 0, 0, 0, 0, 0, 0]
  for (const segment of segments) {
    if (segment.lane < MAX_LANES) continue
    for (let i = 0; i < segment.span; i++) hidden[segment.col + i] += 1
  }
  return hidden
}

function countPerColumn(segments: Segment[]) {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const segment of segments) {
    for (let i = 0; i < segment.span; i++) counts[segment.col + i] += 1
  }
  return counts
}

export function ScheduleCalendar({
  events,
  divisions = [],
  myDivisionId,
  className,
}: {
  events: Event[]
  /** Daftar divisi lengkap — penentu warna chip dan isi legend. */
  divisions?: Division[]
  myDivisionId?: number | null
  className?: string
}) {
  const today = startOfDay(new Date())
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selected, setSelected] = useState(today)

  const ranges = useMemo(
    () => events.map(toRange).filter((r): r is Range => r !== null),
    [events]
  )
  const weeks = useMemo(() => buildWeeks(viewMonth), [viewMonth])
  const layouts = useMemo(
    () => weeks.map((week) => layoutWeek(week, ranges)),
    [weeks, ranges]
  )

  const selectedEvents = useMemo(
    () =>
      ranges
        .filter((r) => r.start <= selected && selected <= r.end)
        .map((r) => r.event)
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ),
    [ranges, selected]
  )

  // Warna chip = warna divisi PEMBUAT event (bukan divisi penyelenggara).
  const divisionColors = useMemo(
    () => divisionColorMap(divisions),
    [divisions]
  )
  const colorOf = (divisionId?: number | null) =>
    (divisionId && divisionColors.get(divisionId)) || NO_DIVISION_COLOR
  const hasNoDivisionChip = useMemo(
    () => ranges.some((range) => !range.event.created_by_division_id),
    [ranges]
  )

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1.4fr_1fr]", className)}>
      <div className="rounded-2xl border bg-card p-2 sm:p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Kalender jadwal</p>
            <h3 className="font-heading text-base font-medium capitalize">
              {monthLabel(viewMonth)}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setViewMonth(
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                )
              }
            >
              <ChevronLeftIcon />
              <span className="sr-only">Bulan sebelumnya</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                setSelected(today)
              }}
            >
              Hari ini
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setViewMonth(
                  new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                )
              }
            >
              <ChevronRightIcon />
              <span className="sr-only">Bulan berikutnya</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-border pb-1 text-center text-xs text-muted-foreground">
          {WEEKDAYS.map((day) => (
            <div key={day} className="font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          {weeks.map((week, weekIndex) => {
            const segments = layouts[weekIndex]
            const hidden = hiddenPerColumn(segments)
            const counts = countPerColumn(segments)
            return (
              <div
                key={`week-${weekIndex}`}
                className="relative border-t border-border first:border-t-0"
              >
                <div className="grid grid-cols-7">
                  {week.map((date, column) => {
                    const inMonth = date.getMonth() === viewMonth.getMonth()
                    const isToday = sameDay(date, today)
                    const isSelected = sameDay(date, selected)
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        style={{ height: CELL_HEIGHT }}
                        onClick={() => setSelected(date)}
                        aria-label={`${dayLabel(date)}, ${counts[column]} event`}
                        className={cn(
                          "flex flex-col items-start border-l border-border p-1.5 text-left transition-colors first:border-l-0",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          !inMonth && "bg-muted/40",
                          isSelected && "bg-primary/5",
                          !isSelected && isToday && "bg-muted/50",
                          !isSelected && "hover:bg-muted/60"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : inMonth
                                ? "text-foreground"
                                : "text-muted-foreground/70"
                          )}
                        >
                          {date.getDate()}
                        </span>
                        {hidden[column] > 0 ? (
                          <span className="mt-auto text-xs font-medium text-foreground">
                            +{hidden[column]} lagi
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                {segments
                  .filter((segment) => segment.lane < MAX_LANES)
                  .map((segment) => {
                    const { range, openStart, openEnd } = segment
                    const singleDay = sameDay(range.start, range.end)
                    const inset = (openStart ? 0 : 2) + (openEnd ? 0 : 2)
                    return (
                      <Link
                        key={`${range.event.id}-${weekIndex}`}
                        href={`/events/${range.event.id}`}
                        title={`${range.event.title} · ${divisionName(range.event)} · ${STATUS_LABEL[range.event.status] ?? range.event.status}`}
                        style={
                          {
                            left: `calc(${(segment.col / 7) * 100}% + ${openStart ? 0 : 2}px)`,
                            width: `calc(${(segment.span / 7) * 100}% - ${inset}px)`,
                            top: LANE_TOP + segment.lane * LANE_STEP,
                            height: BAR_HEIGHT,
                            "--chip-color": colorOf(
                              range.event.created_by_division_id
                            ),
                          } as React.CSSProperties
                        }
                        className={cn(
                          "event-chip absolute flex items-center gap-1 px-1.5 text-xs font-medium",
                          "pointer-events-none sm:pointer-events-auto",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          openStart ? "rounded-l-none" : "rounded-l-md",
                          openEnd ? "rounded-r-none" : "rounded-r-md",
                          range.event.status === "cancelled" && "line-through opacity-60",
                          range.event.status === "finished" && "opacity-65"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 shrink-0 rounded-full",
                            STATUS_DOT[range.event.status] ?? "bg-muted-foreground"
                          )}
                        />
                        {singleDay && !openStart ? (
                          <span className="shrink-0 tabular-nums">
                            {timeLabel(range.event.start_time)}
                          </span>
                        ) : null}
                        <span className="truncate">{range.event.title}</span>
                      </Link>
                    )
                  })}
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Status</span>
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", STATUS_DOT.ongoing)} />
            Berlangsung
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", STATUS_DOT.upcoming)} />
            Mendatang
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full", STATUS_DOT.finished)} />
            Selesai
          </span>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Agenda</p>
        <h3 className="font-heading text-base font-medium">{dayLabel(selected)}</h3>
        <div className="mt-4 flex flex-col gap-3">
          {selectedEvents.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-3 py-6 text-center text-sm text-muted-foreground">
              Tidak ada jadwal pada hari ini
            </p>
          ) : (
            selectedEvents.map((event) => {
              const range = ranges.find((r) => r.event.id === event.id)
              const multiDay = range ? !sameDay(range.start, range.end) : false
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group rounded-xl border p-3 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium group-hover:text-primary">
                        {event.title}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: colorOf(
                              event.created_by_division_id
                            ),
                          }}
                        />
                        <span className="truncate">{divisionName(event)}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {multiDay && range
                          ? `${dayLabel(range.start)} – ${dayLabel(range.end)}`
                          : timeLabel(event.start_time)}
                      </p>
                      {event.location ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPinIcon className="size-3.5" />
                          <span className="truncate">{event.location}</span>
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>

      <DivisionLegend
        divisions={divisions}
        myDivisionId={myDivisionId}
        showNoDivision={hasNoDivisionChip}
        className="lg:col-span-2"
      />
    </div>
  )
}
