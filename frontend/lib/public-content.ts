/**
 * Kontrak data konten publik yang dikelola lewat CRUD admin dan ditampilkan
 * di landing page: Press Release dan Merch.
 *
 * Endpoint backend:
 *   Publik (tanpa login)
 *     GET /public/press_releases?limit=N   -> PressRelease[] (hanya published, terbaru dulu)
 *     GET /public/press_releases/:slug     -> PressRelease (404 bila draft / tidak ada)
 *     GET /public/himpunan                 -> HimpunanItem[] (is_active, urut sort_order)
 *     GET /public/officials                -> OfficialItem[] (dari tabel user: aktif + punya jabatan)
 *     GET /public/work_programs            -> WorkProgramItem[] (is_active; ?limit=&status=&category=; header X-Total-Count)
 *     GET /public/work_programs/:slug      -> WorkProgramItem (404 bila nonaktif / tidak ada)
 *     GET /public/merch                    -> MerchItem[] (hanya is_active, urut sort_order)
 *   Admin (login + permission)
 *     GET/POST       /press_releases       (press_release.manage)
 *     GET/PUT/DELETE /press_releases/:id
 *     GET/POST       /merch                (merch.manage)
 *     GET/PUT/DELETE /merch/:id
 *   POST/PUT menerima multipart/form-data; gambar dikirim di field `cover`
 *   (press release) atau `image` (merch) dan disimpan ke object storage.
 */

export interface PressRelease {
  id: number
  title: string
  slug: string
  /** Ringkasan pendek untuk kartu (maks 300 karakter). */
  excerpt: string
  /** Isi lengkap, HTML dari rich text editor (sudah disanitasi backend). */
  content: string
  cover_url?: string | null
  /** Label bebas, mis. "Siaran Pers", "Kegiatan", "Prestasi". */
  category: string
  published: boolean
  /** Terisi saat pertama kali dipublikasikan. */
  published_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface MerchItem {
  id: number
  name: string
  description: string
  /** Harga dalam rupiah (bilangan bulat). */
  price: number
  image_url?: string | null
  /** Tautan pemesanan (WhatsApp, form, marketplace). */
  order_url: string
  /** Label bebas, mis. "Apparel", "Aksesoris". */
  category: string
  is_active: boolean
  /** Status stok: "ready" | "preorder" | "soldout". */
  stock_status: "ready" | "preorder" | "soldout" | string
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface HimpunanItem {
  id: number
  name: string
  short_label: string
  institution: string
  city: string
  address: string
  email: string
  logo_url: string
  is_active: boolean
  sort_order: number
  /** Daerah 1-6; 0 = belum ditentukan. */
  region?: number
  created_at?: string
  updated_at?: string
}

export interface OfficialItem {
  id: number
  /** Nama divisi (dari `division.name`), jadi label tab di landing. */
  division: string
  name: string
  /** Jabatan, mis. "Kepala Divisi". */
  role: string
  /** Himpunan asal. */
  origin: string
  avatar_url?: string
}

export type WorkProgramCategory = "program_kerja" | "agenda"
export type WorkProgramStatus = "upcoming" | "done"

export interface WorkProgramItem {
  id: number
  name: string
  slug: string
  description: string
  cadence: string
  category: WorkProgramCategory
  status: WorkProgramStatus
  division_id?: number | null
  division_name?: string | null
  /** Tanggal pelaksanaan "YYYY-MM-DD" atau null. */
  start_date?: string | null
  end_date?: string | null
  location?: string
  /** Tuan rumah (teks bebas). */
  host?: string
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}
