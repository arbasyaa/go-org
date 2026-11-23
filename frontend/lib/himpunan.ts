import { apiRequest } from "@/lib/api"
import { unwrapList } from "@/lib/format"
import type { HimpunanItem, HimpunanOption } from "@/lib/public-content"

/**
 * Pilihan asal himpunan untuk dropdown form (profil, admin user, form karya).
 *
 * Memakai endpoint publik yang sudah ada, bukan endpoint khusus admin: daftar
 * himpunan aktif memang informasi publik, dan route statis di bawah
 * `/himpunan/:id` akan tertelan router linear gokil.
 */
export async function fetchHimpunanOptions(): Promise<HimpunanOption[]> {
  const rows = await apiRequest<HimpunanItem[] | { items: HimpunanItem[] }>(
    "/public/himpunan"
  ).then(unwrapList)
  return rows.map((h) => ({
    id: h.id,
    label: h.short_label || h.name,
    name: h.name,
  }))
}
