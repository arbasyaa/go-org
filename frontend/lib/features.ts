/**
 * Saklar modul. Dimatikan = disembunyikan dari UI (menu, kartu dasbor, halaman);
 * kode, tabel, dan data tetap utuh sehingga bisa dinyalakan lagi kapan saja.
 *
 * `finance` dan `attendance` (absen mandiri: selfie + tanda tangan) dimatikan
 * atas permintaan — fokus sementara ke event, kalender, dan **perizinan**.
 * Endpoint API-nya sengaja tetap hidup supaya integrasi yang sudah ada tidak
 * putus dan data lama tetap bisa dibaca.
 */
export const FEATURES = {
  finance: false,
  attendance: false,
} as const
