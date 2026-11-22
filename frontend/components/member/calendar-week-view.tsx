"use client"

import { useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { EventPopover } from "@/components/member/event-popover"
import {
  dayLabel,
  divisionName,
  eventWhenLabel,
  isAllDayRange,
  layoutTimed,
  layoutWeek,
  rangeOnDay,
  sameDay,
  sortByStart,
  startOfDay,
  STATUS_DOT,
  timeLabel,
  WEEKDAYS,
  type Range,
} from "@/components/member/calendar-utils"
import { cn } from "@/lib/utils"

const HOUR_HEIGHT = 48
const DEFAULT_FIRST_HOUR = 7
const ALLDAY_STEP = 24
const ALLDAY_BAR = 22
const GUTTER = "3.5rem"

const HOURS = Array.from({ length: 24 }, (_, h) => h)

function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}.00`
}

/**
 * Tampilan minggu ala Google Calendar: baris "sepanjang hari" di atas, lalu
 * grid jam (00–24, awal scroll di 07.00) dengan blok event setinggi durasinya.
 */
export function CalendarWeekView({
  week,
  ranges,
  today,
  now,
  colorOf,
}: {
  week: Date[]
  ranges: Range[]
  today: Date
  /** null sebelum hidrasi (server) — garis "sekarang" tidak dirender. */
  now: Date | null
  colorOf: (divisionId?: number | null) => string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const allDaySegments = useMemo(
    () =>
      layoutWeek(
        week,
        ranges.filter((r) => isAllDayRange(r))
      ),
    [week, ranges]
  )
  const allDayLanes =
    allDaySegments.reduce((max, s) => Math.max(max, s.lane + 1), 0) || 0

  const blocksByDay = useMemo(
    () => week.map((day) => layoutTimed(day, ranges)),
    [week, ranges]
  )

  // Awal scroll: 07.00, atau satu jam sebelum event paling pagi minggu ini.
  const firstHour = useMemo(() => {
    let earliest = DEFAULT_FIRST_HOUR
    for (const blocks of blocksByDay) {
      for (const block of blocks) {
        earliest = Math.min(earliest, Math.max(0, Math.floor(block.startMin / 60) - 1))
      }
    }
    return earliest
  }, [blocksByDay])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = Math.max(0, firstHour * HOUR_HEIGHT - 8)
  }, [firstHour, week])

  const nowMinutes = now ? now.getHours() * 60 + now.getMinutes() : 0

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Header hari */}
      <div
        className="grid border-b border-border"
        style={{ gridTemplateColumns: `${GUTTER} repeat(7, minmax(0, 1fr))` }}
      >
        <div />
        {week.map((date, i) => {
          const isToday = sameDay(date, today)
          return (
            <div
              key={date.toISOString()}
              className="flex flex-col items-center gap-0.5 border-l border-border py-1.5"
            >
              <span
                className={cn(
                  "text-xs font-medium",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                {WEEKDAYS[i]}
              </span>
              <span
                aria-label={dayLabel(date)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-base font-medium tabular-nums",
                  isToday && "bg-primary text-primary-foreground"
                )}
              >
                {date.getDate()}
              </span>
            </div>
          )
        })}
      </div>

      {/* Baris sepanjang hari / multi-hari */}
      {allDayLanes > 0 ? (
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `${GUTTER} minmax(0, 1fr)` }}
        >
          <div className="flex items-start justify-end px-1.5 pt-1.5 text-[10px] leading-tight text-muted-foreground">
            Seharian
          </div>
          <div
            className="relative border-l border-border"
            style={{ height: allDayLanes * ALLDAY_STEP + 6 }}
          >
            <div aria-hidden className="absolute inset-0 grid grid-cols-7">
              {week.map((date) => (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "border-l border-border first:border-l-0",
                    sameDay(date, today) && "bg-primary/5"
                  )}
                />
              ))}
            </div>
            {allDaySegments.map((segment) => {
              const { range, openStart, openEnd } = segment
              const inset = (openStart ? 0 : 2) + (openEnd ? 0 : 2)
              return (
                <EventPopover
                  key={range.event.id}
                  range={range}
                  color={colorOf(range.event.created_by_division_id)}
                  style={
                    {
                      left: `calc(${(segment.col / 7) * 100}% + ${openStart ? 0 : 2}px)`,
                      width: `calc(${(segment.span / 7) * 100}% - ${inset}px)`,
                      top: 3 + segment.lane * ALLDAY_STEP,
                      height: ALLDAY_BAR,
                      "--chip-color": colorOf(range.event.created_by_division_id),
                    } as React.CSSProperties
                  }
                  className={cn(
                    "event-chip absolute flex items-center gap-1 px-1.5 text-left text-xs font-medium",
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
                  <span className="truncate">{range.event.title}</span>
                </EventPopover>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Grid jam */}
      <div ref={scrollRef} className="max-h-[540px] overflow-y-auto">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `${GUTTER} repeat(7, minmax(0, 1fr))`,
            height: 24 * HOUR_HEIGHT,
          }}
        >
          <div className="relative">
            {HOURS.slice(1).map((h) => (
              <span
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums"
                style={{ top: h * HOUR_HEIGHT }}
              >
                {hourLabel(h)}
              </span>
            ))}
          </div>

          {/* Garis jam melintang di belakang kolom */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0"
            style={{ left: GUTTER }}
          >
            {HOURS.slice(1).map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-border/70"
                style={{ top: h * HOUR_HEIGHT }}
              />
            ))}
          </div>

          {week.map((date, dayIndex) => {
            const isToday = sameDay(date, today)
            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "relative border-l border-border",
                  isToday && "bg-primary/5"
                )}
              >
                {blocksByDay[dayIndex].map((block) => {
                  const { range } = block
                  const color = colorOf(range.event.created_by_division_id)
                  const top = (block.startMin / 60) * HOUR_HEIGHT
                  const height = Math.max(
                    ((block.endMin - block.startMin) / 60) * HOUR_HEIGHT,
                    20
                  )
                  return (
                    <EventPopover
                      key={range.event.id}
                      range={range}
                      color={color}
                      side="right"
                      style={
                        {
                          top,
                          height: height - 1,
                          left: `calc(${(block.col / block.cols) * 100}% + 1px)`,
                          width: `calc(${100 / block.cols}% - 3px)`,
                          "--chip-color": color,
                        } as React.CSSProperties
                      }
                      className={cn(
                        "event-chip absolute flex flex-col items-start overflow-hidden rounded-md px-1.5 py-0.5 text-left text-xs",
                        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                        range.event.status === "cancelled" && "line-through opacity-60",
                        range.event.status === "finished" && "opacity-65"
                      )}
                    >
                      <span className="w-full truncate font-medium">
                        {range.event.title}
                      </span>
                      {height >= 38 ? (
                        <span className="w-full truncate text-muted-foreground tabular-nums">
                          {timeLabel(range.event.start_time)}
                          {range.event.end_time
                            ? ` – ${timeLabel(range.event.end_time)}`
                            : ""}
                        </span>
                      ) : null}
                    </EventPopover>
                  )
                })}
                {isToday && now ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
                  >
                    <span className="-ml-1 size-2 shrink-0 rounded-full bg-destructive" />
                    <span className="h-0.5 flex-1 bg-destructive" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * Cadangan layar sempit: grid 7 kolom tidak muat, jadi minggu yang sedang
 * dilihat ditampilkan sebagai daftar agenda per hari.
 */
export function CalendarWeekAgenda({
  week,
  ranges,
  today,
  colorOf,
}: {
  week: Date[]
  ranges: Range[]
  today: Date
  colorOf: (divisionId?: number | null) => string
}) {
  const days = week
    .map((date) => ({
      date,
      items: ranges.filter((r) => rangeOnDay(r, startOfDay(date))).sort(sortByStart),
    }))
    .filter((d) => d.items.length > 0)

  if (days.length === 0) {
    return (
      <p className="rounded-xl bg-muted/50 px-3 py-6 text-center text-sm text-muted-foreground">
        Tidak ada jadwal pada minggu ini
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map(({ date, items }) => (
        <section key={date.toISOString()} className="flex flex-col gap-2">
          <h4
            className={cn(
              "text-sm font-medium",
              sameDay(date, today) && "text-primary"
            )}
          >
            {dayLabel(date)}
            {sameDay(date, today) ? " · Hari ini" : ""}
          </h4>
          {items.map((range) => (
            <Link
              key={range.event.id}
              href={`/events/${range.event.id}`}
              style={
                {
                  "--chip-color": colorOf(range.event.created_by_division_id),
                } as React.CSSProperties
              }
              className="event-chip flex flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="truncate font-medium">{range.event.title}</span>
              <span className="text-xs text-muted-foreground">
                {eventWhenLabel(range)} · {divisionName(range.event)}
              </span>
            </Link>
          ))}
        </section>
      ))}
    </div>
  )
}
