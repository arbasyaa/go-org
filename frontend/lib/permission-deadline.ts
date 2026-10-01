/** Jam batas pengajuan izin sebelum event mulai — samakan dengan
 * `services.PermissionLeadTime` di backend (3 jam). */
export const PERMISSION_LEAD_HOURS = 3

/** Batas akhir pengajuan izin untuk sebuah event (start − 3 jam). */
export function permissionDeadline(startTime?: string | null) {
  if (!startTime) return null
  const start = new Date(startTime)
  if (Number.isNaN(start.getTime())) return null
  return new Date(start.getTime() - PERMISSION_LEAD_HOURS * 60 * 60 * 1000)
}

/** true kalau pengajuan izin sudah ditutup (termasuk saat event berjalan). */
export function isPermissionClosed(
  startTime?: string | null,
  now: Date = new Date()
) {
  const deadline = permissionDeadline(startTime)
  return deadline ? now.getTime() > deadline.getTime() : false
}

/** Contoh: "1 Okt 2026, 16.00" — untuk pesan "izin ditutup sejak …". */
export function permissionDeadlineLabel(startTime?: string | null) {
  const deadline = permissionDeadline(startTime)
  if (!deadline) return ""
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(deadline)
}
