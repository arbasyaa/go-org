"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import {
  CalendarWeekAgenda,
  CalendarWeekView,
} from "@/components/member/calendar-week-view"
import { DivisionLegend } from "@/components/member/division-legend"
import { EventPopover } from "@/components/member/event-popover"
import {
  addDays,
  buildWeeks,
  dayLabel,
  divisionName,
  isAllDayRange,
  layoutWeek,
  monthLabel,
  rangeOnDay,
  sameDay,
  sortByStart,
  startOfDay,
  STATUS_DOT,
  timeLabel,
  toRange,
  weekOf,
  weekTitle,
  WEEKDAYS,
  type Range,
  type Segment,
} from "@/components/member/calendar-utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { divisionColorMap, NO_DIVISION_COLOR } from "@/lib/division-color"
import { cn } from "@/lib/utils"
import type { Division, Event } from "@/lib/types"

type View = "month" | "week"

/** Baris chip maksimal per hari. Sisa event diringkas jadi "+N lainnya". */
const MAX_LANES = 3
const CELL_HEIGHT = 144
const LANE_TOP = 32
const LANE_STEP = 24
const BAR_HEIGHT = 22

function hiddenPerColumn(segments: Segment[]) {
  const hidden = [0, 0, 0, 0, 0, 0, 0]
  for (const segment of segments) {
    if (segment.lane < MAX_LANES) continue
    for (let i = 0; i < segment.span; i++) hidden[segment.col + i] += 1
  }
  return hidden
}

function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 30_000)
  return () => window.clearInterval(id)
}
const minuteSnapshot = () => Math.floor(Date.now() / 60_000)
const serverMinuteSnapshot = () => 0

/**
 * Kalender jadwal ala Google Calendar: tampilan Bulan / Minggu, tombol
 * "Hari ini", filter divisi lewat legend, dan popover ringkasan event.
 */
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
  // Menit berjalan lewat external store: nol di server (belum hidrasi), lalu
  // diperbarui interval tanpa setState di effect.
  const minute = useSyncExternalStore(
    subscribeMinute,
    minuteSnapshot,
    serverMinuteSnapshot
  )
  const now = useMemo(() => (minute ? new Date(minute * 60_000) : null), [minute])
  const today = useMemo(() => startOfDay(now ?? new Date()), [now])

  const [view, setView] = useState<View>("month")
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()))
  // Hari terpilih (mobile). null = pakai default turunan (hari ini / tanggal 1).
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<number>>(
    () => new Set()
  )

  const viewMonth = useMemo(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    [anchor]
  )
  const week = useMemo(() => weekOf(anchor), [anchor])
  const weeks = useMemo(() => buildWeeks(viewMonth), [viewMonth])

  const allRanges = useMemo(
    () => events.map(toRange).filter((r): r is Range => r !== null),
    [events]
  )
  const ranges = useMemo(
    () =>
      allRanges.filter(
        (r) => !hiddenIds.has(r.event.created_by_division_id ?? 0)
      ),
    [allRanges, hiddenIds]
  )
  const layouts = useMemo(
    () => weeks.map((w) => layoutWeek(w, ranges)),
    [weeks, ranges]
  )

  // Warna chip = warna divisi PEMBUAT event (bukan divisi penyelenggara).
  const divisionColors = useMemo(
    () => divisionColorMap(divisions),
    [divisions]
  )
  const colorOf = (divisionId?: number | null) =>
    (divisionId && divisionColors.get(divisionId)) || NO_DIVISION_COLOR
  const hasNoDivisionChip = useMemo(
    () => allRanges.some((r) => !r.event.created_by_division_id),
    [allRanges]
  )

  const selected = (() => {
    if (selectedDay && selectedDay.getMonth() === viewMonth.getMonth() && selectedDay.getFullYear() === viewMonth.getFullYear()) {
      return selectedDay
    }
    return sameDay(viewMonth, new Date(today.getFullYear(), today.getMonth(), 1))
      ? today
      : viewMonth
  })()
  const selectedEvents = ranges
    .filter((r) => rangeOnDay(r, selected))
    .sort(sortByStart)

  function selectDay(date: Date) {
    setSelectedDay(date)
    // Tap tanggal bulan lain: pindah ke bulan tersebut.
    if (date.getMonth() !== viewMonth.getMonth()) {
      setAnchor(new Date(date.getFullYear(), date.getMonth(), 1))
    }
  }

  function toggleDivision(id: number) {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function step(direction: -1 | 1) {
    setSelectedDay(null)
    setAnchor((prev) =>
      view === "month"
        ? new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
        : addDays(prev, direction * 7)
    )
  }

  function changeView(next: View) {
    setView(next)
    // Pindah ke Minggu: fokus ke hari ini bila ada di bulan yang dilihat.
    if (next === "week" && sameDay(viewMonth, new Date(today.getFullYear(), today.getMonth(), 1))) {
      setAnchor(today)
    }
  }

  function openWeekOf(date: Date) {
    setAnchor(date)
    setView("week")
  }

  const title = view === "month" ? monthLabel(viewMonth) : weekTitle(week)

  return (
    <div className={cn("rounded-2xl border bg-card p-2 sm:p-4", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAnchor(today)
              setSelectedDay(null)
            }}
          >
            Hari ini
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => step(-1)}>
            <ChevronLeftIcon />
            <span className="sr-only">
              {view === "month" ? "Bulan sebelumnya" : "Minggu sebelumnya"}
            </span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => step(1)}>
            <ChevronRightIcon />
            <span className="sr-only">
              {view === "month" ? "Bulan berikutnya" : "Minggu berikutnya"}
            </span>
          </Button>
          <h3
            aria-live="polite"
            className="font-heading text-base font-medium capitalize sm:text-lg"
          >
            {title}
          </h3>
        </div>
        <Tabs
          value={view}
          onValueChange={(value) => changeView(value === "week" ? "week" : "month")}
        >
          <TabsList aria-label="Tampilan kalender">
            <TabsTrigger value="month">Bulan</TabsTrigger>
            <TabsTrigger value="week">Minggu</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "month" ? (
        <>
          <div className="grid grid-cols-7 border-b border-border pb-1 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day} className="font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Mobile: grid ringkas (titik warna) + agenda hari terpilih. */}
          <div className="sm:hidden">
            <div className="overflow-hidden rounded-lg border border-border">
              {weeks.map((weekDays, weekIndex) => (
                <div
                  key={`m-week-${weekIndex}`}
                  className="grid grid-cols-7 border-t border-border first:border-t-0"
                >
                  {weekDays.map((date) => {
                    const inMonth = date.getMonth() === viewMonth.getMonth()
                    const isToday = sameDay(date, today)
                    const isSelected = sameDay(date, selected)
                    const dayEvents = ranges
                      .filter((r) => rangeOnDay(r, date))
                      .sort(sortByStart)
                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => selectDay(date)}
                        aria-label={`${dayLabel(date)}, ${dayEvents.length} kegiatan`}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex h-12 flex-col items-center justify-center gap-0.5 border-l border-border first:border-l-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          !inMonth && "bg-muted/40"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : isSelected
                                ? "bg-primary/10 text-primary ring-1 ring-primary"
                                : inMonth
                                  ? "text-foreground"
                                  : "text-muted-foreground/70",
                            isToday && isSelected && "ring-2 ring-primary/40"
                          )}
                        >
                          {date.getDate()}
                        </span>
                        <span className="flex h-1.5 items-center gap-0.5">
                          {dayEvents.slice(0, 3).map((r) => (
                            <span
                              key={r.event.id}
                              aria-hidden
                              className="size-1.5 rounded-full"
                              style={{
                                backgroundColor: colorOf(
                                  r.event.created_by_division_id
                                ),
                              }}
                            />
                          ))}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            <section aria-label="Agenda hari terpilih" className="mt-3">
              <h4 className="mb-2 text-sm font-medium capitalize">
                {dayLabel(selected)}
              </h4>
              {selectedEvents.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Tidak ada kegiatan
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {selectedEvents.map((r) => {
                    const color = colorOf(r.event.created_by_division_id)
                    const when = isAllDayRange(r)
                      ? "Seharian"
                      : `${timeLabel(r.event.start_time)}${r.event.end_time ? ` – ${timeLabel(r.event.end_time)}` : ""}`
                    return (
                      <li key={r.event.id}>
                        <EventPopover
                          range={r}
                          color={color}
                          side="top"
                          className="flex w-full items-stretch gap-2.5 rounded-md bg-muted/40 p-2 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span
                            aria-hidden
                            className="w-1 shrink-0 self-stretch rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span
                              className={cn(
                                "truncate text-sm font-medium",
                                r.event.status === "cancelled" &&
                                  "line-through opacity-60"
                              )}
                            >
                              {r.event.title}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {when}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {divisionName(r.event)}
                            </span>
                          </span>
                        </EventPopover>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
            {weeks.map((weekDays, weekIndex) => {
              const segments = layouts[weekIndex]
              const hidden = hiddenPerColumn(segments)
              return (
                <div
                  key={`week-${weekIndex}`}
                  className="relative border-t border-border first:border-t-0"
                >
                  <div className="grid grid-cols-7">
                    {weekDays.map((date, column) => {
                      const inMonth = date.getMonth() === viewMonth.getMonth()
                      const isToday = sameDay(date, today)
                      const dayEvents = ranges
                        .filter((r) => rangeOnDay(r, date))
                        .sort(sortByStart)
                      return (
                        <div
                          key={date.toISOString()}
                          style={{ height: CELL_HEIGHT }}
                          className={cn(
                            "relative flex flex-col items-start border-l border-border p-1.5 first:border-l-0",
                            !inMonth && "bg-muted/40"
                          )}
                        >
                          {/* Layar sempit: seluruh sel membuka agenda minggu itu. */}
                          <button
                            type="button"
                            onClick={() => openWeekOf(date)}
                            aria-label={`${dayLabel(date)}, ${dayEvents.length} event. Buka minggu`}
                            className="absolute inset-0 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:hidden"
                          />
                          <button
                            type="button"
                            onClick={() => openWeekOf(date)}
                            aria-label={`${dayLabel(date)}, ${dayEvents.length} event`}
                            className={cn(
                              "relative flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : inMonth
                                  ? "text-foreground hover:bg-muted"
                                  : "text-muted-foreground/70 hover:bg-muted"
                            )}
                          >
                            {date.getDate()}
                          </button>
                          {hidden[column] > 0 ? (
                            <Popover>
                              <PopoverTrigger className="absolute bottom-1 left-1.5 rounded px-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                                <span className="hidden sm:inline">
                                  +{hidden[column]} lainnya
                                </span>
                                <span className="sm:hidden">
                                  +{hidden[column]}
                                </span>
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-72">
                                <PopoverTitle className="capitalize">
                                  {dayLabel(date)}
                                </PopoverTitle>
                                <ul className="flex flex-col gap-1">
                                  {dayEvents.map((r) => (
                                    <li key={r.event.id}>
                                      <Link
                                        href={`/events/${r.event.id}`}
                                        style={
                                          {
                                            "--chip-color": colorOf(
                                              r.event.created_by_division_id
                                            ),
                                          } as React.CSSProperties
                                        }
                                        className="event-chip flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                      >
                                        {!r.event.all_day &&
                                        sameDay(r.start, r.end) ? (
                                          <span className="shrink-0 tabular-nums">
                                            {timeLabel(r.event.start_time)}
                                          </span>
                                        ) : null}
                                        <span className="truncate">
                                          {r.event.title}
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  {segments
                    .filter((segment) => segment.lane < MAX_LANES)
                    .map((segment) => {
                      const { range, openStart, openEnd } = segment
                      const singleDay = sameDay(range.start, range.end)
                      const inset = (openStart ? 0 : 2) + (openEnd ? 0 : 2)
                      const color = colorOf(range.event.created_by_division_id)
                      return (
                        <EventPopover
                          key={`${range.event.id}-${weekIndex}`}
                          range={range}
                          color={color}
                          style={
                            {
                              left: `calc(${(segment.col / 7) * 100}% + ${openStart ? 0 : 2}px)`,
                              width: `calc(${(segment.span / 7) * 100}% - ${inset}px)`,
                              top: LANE_TOP + segment.lane * LANE_STEP,
                              height: BAR_HEIGHT,
                              "--chip-color": color,
                            } as React.CSSProperties
                          }
                          className={cn(
                            "event-chip absolute flex items-center gap-1 px-1.5 text-left text-xs font-medium",
                            "pointer-events-none sm:pointer-events-auto",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            openStart ? "rounded-l-none" : "rounded-l-md",
                            openEnd ? "rounded-r-none" : "rounded-r-md",
                            range.event.status === "cancelled" &&
                              "line-through opacity-60",
                            range.event.status === "finished" && "opacity-65"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 shrink-0 rounded-full",
                              STATUS_DOT[range.event.status] ??
                                "bg-muted-foreground"
                            )}
                          />
                          {singleDay && !openStart && !range.event.all_day ? (
                            <span className="shrink-0 tabular-nums">
                              {timeLabel(range.event.start_time)}
                            </span>
                          ) : null}
                          <span className="truncate">{range.event.title}</span>
                        </EventPopover>
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
        </>
      ) : (
        <>
          <div className="hidden sm:block">
            <CalendarWeekView
              week={week}
              ranges={ranges}
              today={today}
              now={now}
              colorOf={colorOf}
            />
          </div>
          <div className="sm:hidden">
            <CalendarWeekAgenda
              week={week}
              ranges={ranges}
              today={today}
              colorOf={colorOf}
            />
          </div>
        </>
      )}

      <DivisionLegend
        divisions={divisions}
        myDivisionId={myDivisionId}
        showNoDivision={hasNoDivisionChip}
        hiddenIds={hiddenIds}
        onToggle={toggleDivision}
        onReset={() => setHiddenIds(new Set())}
        className="mt-4 rounded-none border-0 border-t bg-transparent p-0 pt-3"
      />
    </div>
  )
}
