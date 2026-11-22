import { creatorDivisionLabel } from "@/lib/division-color"
import type { Event } from "@/lib/types"

export const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export const STATUS_LABEL: Record<string, string> = {
  upcoming: "Mendatang",
  ongoing: "Berlangsung",
  finished: "Selesai",
  cancelled: "Dibatalkan",
}

export const STATUS_DOT: Record<string, string> = {
  ongoing: "bg-primary",
  upcoming: "bg-muted-foreground/70",
  finished: "bg-muted-foreground/40",
  cancelled: "bg-destructive",
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function addDays(d: Date, days: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

export function daysBetween(a: Date, b: Date) {
  // Pembulatan aman terhadap pergantian DST (hari bisa 23/25 jam).
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(d)
}

export function dayLabel(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d)
}

/** Judul rentang minggu, mis. "16 – 22 November 2026" atau "30 Nov – 6 Des 2026". */
export function weekTitle(week: Date[]) {
  const first = week[0]
  const last = week[6]
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("id-ID", opts).format(d)
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} – ${last.getDate()} ${fmt(last, { month: "long", year: "numeric" })}`
  }
  if (first.getFullYear() === last.getFullYear()) {
    return `${fmt(first, { day: "numeric", month: "short" })} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`
  }
  return `${fmt(first, { day: "numeric", month: "short", year: "numeric" })} – ${fmt(last, { day: "numeric", month: "short", year: "numeric" })}`
}

export function timeLabel(value: string | Date) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(typeof value === "string" ? new Date(value) : value)
  } catch {
    return ""
  }
}

export function divisionName(event: Event) {
  return creatorDivisionLabel(
    event.created_by_division_name,
    event.created_by_division_id
  )
}

export type Range = { event: Event; start: Date; end: Date }
export type Segment = {
  range: Range
  col: number
  span: number
  lane: number
  openStart: boolean
  openEnd: boolean
}

function isMidnight(d: Date) {
  return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0
}

/**
 * Rentang hari event, inklusif di kedua ujung. Event yang selesai tepat tengah
 * malam (00:00) tidak menambah satu hari — sama seperti Google Calendar.
 */
export function toRange(event: Event): Range | null {
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

/** Event muncul di baris "sepanjang hari": all-day atau melewati lebih dari satu hari. */
export function isAllDayRange(range: Range) {
  return Boolean(range.event.all_day) || !sameDay(range.start, range.end)
}

export function rangeOnDay(range: Range, day: Date) {
  return range.start <= day && day <= range.end
}

export function sortByStart(a: Range, b: Range) {
  return (
    new Date(a.event.start_time).getTime() -
    new Date(b.event.start_time).getTime()
  )
}

/** Teks waktu event untuk popover/agenda. */
export function eventWhenLabel(range: Range) {
  const { event } = range
  if (!sameDay(range.start, range.end)) {
    return `${dayLabel(range.start)} – ${dayLabel(range.end)}`
  }
  if (event.all_day) return `${dayLabel(range.start)} · Sepanjang hari`
  const end = event.end_time ? timeLabel(event.end_time) : ""
  return `${dayLabel(range.start)} · ${timeLabel(event.start_time)}${end ? ` – ${end}` : ""}`
}

export function buildWeeks(viewMonth: Date) {
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

/** Minggu (Senin–Minggu) yang memuat tanggal `anchor`. */
export function weekOf(anchor: Date) {
  const monday = addDays(anchor, -((anchor.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** Potong event ke satu minggu, lalu susun ke baris (lane) tanpa saling tumpuk. */
export function layoutWeek(week: Date[], ranges: Range[]) {
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

export type TimedBlock = {
  range: Range
  /** Menit sejak 00:00. */
  startMin: number
  endMin: number
  col: number
  cols: number
}

/**
 * Susun event berjam dalam satu hari: event yang beririsan dibagi berdampingan
 * (cluster → kolom pertama yang kosong), seperti Google Calendar.
 */
export function layoutTimed(day: Date, ranges: Range[]): TimedBlock[] {
  const items = ranges
    .filter((r) => !isAllDayRange(r) && sameDay(r.start, day))
    .map((range) => {
      const start = new Date(range.event.start_time)
      const startMin = start.getHours() * 60 + start.getMinutes()
      const rawEnd = range.event.end_time
        ? new Date(range.event.end_time)
        : null
      let endMin = rawEnd
        ? sameDay(startOfDay(rawEnd), day)
          ? rawEnd.getHours() * 60 + rawEnd.getMinutes()
          : 24 * 60
        : startMin + 60
      if (endMin <= startMin) endMin = Math.min(24 * 60, startMin + 60)
      return { range, startMin, endMin }
    })
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)

  const blocks: TimedBlock[] = []
  let cluster: TimedBlock[] = []
  let clusterEnd = -1
  let colEnds: number[] = []

  const flush = () => {
    for (const block of cluster) block.cols = colEnds.length
    blocks.push(...cluster)
    cluster = []
    colEnds = []
    clusterEnd = -1
  }

  for (const item of items) {
    if (cluster.length > 0 && item.startMin >= clusterEnd) flush()
    // Tinggi minimal visual 20 menit dipakai juga saat deteksi tabrakan.
    const visualEnd = Math.max(item.endMin, item.startMin + 20)
    let col = colEnds.findIndex((end) => end <= item.startMin)
    if (col === -1) {
      col = colEnds.length
      colEnds.push(visualEnd)
    } else {
      colEnds[col] = visualEnd
    }
    cluster.push({ ...item, col, cols: 1 })
    clusterEnd = Math.max(clusterEnd, visualEnd)
  }
  flush()
  return blocks
}
