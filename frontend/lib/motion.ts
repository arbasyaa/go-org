/**
 * Animasi masuk halaman (lihat `animate-fade-in-up` di globals.css).
 *
 * Dipakai bertahap (stagger) untuk daftar kartu; dibatasi 8 langkah supaya
 * item ke-9 dst. tidak menunggu lama, dan otomatis nonaktif saat
 * `prefers-reduced-motion` (aturan di globals.css).
 */
export const FADE_IN = "animate-fade-in-up"

export function fadeInDelay(index: number, stepMs = 45) {
  return { animationDelay: `${Math.min(index, 8) * stepMs}ms` }
}
