export interface Invitation {
  id: number
  organization_name: string
  event_name: string
  /** Tanggal berlangsung acara (ISO date, tanpa jam). */
  event_date: string
  attachment_url?: string | null
  attachment_name?: string | null
  attachment_size?: number | null
  status: "submitted" | "converted" | string
  event_id?: number | null
  /** Ringkasan event hasil konversi; null selama belum dikonversi. */
  event?: {
    id: number
    title: string
    start_time: string
    end_time: string
    status: string
  } | null
  submitted_ip?: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Peserta yang ditugaskan berangkat pada sebuah event.
 *
 * Penugasan melekat di event (bukan di undangan), supaya daftar peserta tetap
 * ada walau undangan asalnya dihapus. `self_assigned` menandai anggota yang
 * mendaftarkan dirinya sendiri (assigned_by_id kosong).
 */
export interface EventAssignee {
  id: number
  user_id: number
  assigned_by_id?: number | null
  self_assigned?: boolean
  full_name?: string | null
  username?: string | null
  asal_himpunan?: string | null
  jabatan?: string | null
  avatar_url?: string | null
  created_at?: string
}
