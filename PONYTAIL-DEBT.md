# PONYTAIL-DEBT.md — utang & penundaan yang disengaja

Ledger ini mencatat pekerjaan yang **sengaja** ditunda atau disederhanakan, supaya
tidak berubah jadi "nanti berarti tidak pernah". Format tiap baris:

```
<file>:<baris> — <apa yang ditunda>. ceiling: <batas yang diterima sekarang>. upgrade: <kapan harus dikerjakan>
```

Baris tanpa `upgrade:` ditandai **no-trigger** (akan membusuk diam-diam).

| Lokasi | Yang ditunda | Ceiling sekarang | Upgrade saat |
|---|---|---|---|
| `backend/services/letter_number.go` | Penyempurnaan **penomoran surat** (dipesan "nanti dulu"): contoh template di `/admin/letters/categories` masih memakai nama panjang di segmen literal (`.../Permikomnas Jawa Tengah/VII/2026`) dan belum ada preset singkatan per kategori | Contoh template panjang; admin harus mengedit template sendiri di menu Kategori Surat | Penomoran surat benar-benar dipakai produksi, atau diminta versi pendek (mis. `PJ`) → tambah preset/segmen singkatan |
| `frontend/lib/features.ts` | **Modul keuangan dimatikan** atas permintaan (fokus ke event, kalender, perizinan) | Sidebar, halaman `/admin/finance`, dan kartu saldo di dasbor disembunyikan; **API + tabel + data tetap hidup** | Bendahara siap, atau diminta menyalakan kembali → setel `FEATURES.finance = true` |
| `frontend/lib/features.ts` (`attendance`) + `app/(member)/events/[id]/attendance/layout.tsx` | **Absensi mandiri (selfie + tanda tangan) dimatikan** — dipesan "absensi nanti dulu, izin dulu" | Tombol "Absen sekarang" hilang dan halaman absensi menampilkan pemberitahuan; ketidakhadiran dicatat lewat alur **izin**. API, tabel, dan data absensi lama tetap utuh | Absensi mau dipakai lagi (butuh bukti kehadiran fisik) → setel `FEATURES.attendance = true` |
| `backend/services/event_audience.go:119` | Satu query semua user per resolusi cakupan peserta, lalu difilter di memori (karena `Filter("__in")` gokil salah menomori placeholder) | O(jumlah anggota aktif) per pemakaian cakupan; aman untuk ratusan anggota | Anggota menembus ribuan, atau resolusi cakupan jadi jalur panas → pecah ke query per-sumbu |
| `frontend/lib/division-color.ts` (`DESIGN.md` §6.11) | Pembagian warna chip kalender otomatis hanya punya 8 token `--division-1..8` | >8 divisi akan mulai mengulang warna | Divisi bertambah jadi >8 → tambah token divisi (dan jaga jarak oklab ke aksen) |
| Hapus domain (`EventService.Delete`, `PermissionRequestService.Delete`, dst.) | Tidak menghapus objek storage terkait (selfie, tanda tangan, bukti izin) | Objek yatim menumpuk di `backend/storage`; pernah 11 file menumpuk. Pembersihan manual: bandingkan `*_url` di DB vs isi folder | Storage mulai membengkak / ada keluhan kuota → hapus objek saat delete domain (pola `DELETE /storage/files/:id`) |
| `backend/app/register.go` (generator gokil) | `generateroutes` mengurutkan route per path sehingga segmen statis 2-segmen di bawah `/:id` **tertutup** (pernah menimpa `GET /letters/export`) | Route statis seperti itu dilarang; dijaga `app/register_test.go`. Ekspor surat dipindah ke `GET /letters?export=csv` | Generator gokil di-patch (urutkan statis sebelum dinamis) → aturan ini di `DESIGN.md` §0.1 bisa dicabut |
| `frontend/app/(admin)/admin/announcements/page.tsx:61`, `frontend/app/(member)/announcements/page.tsx:41`, `frontend/components/attachment-upload-field.tsx:51`, `frontend/components/image-upload-field.tsx:63`, `frontend/components/webcam-capture.tsx:50`, `frontend/hooks/use-settings.ts:34` | 7 error eslint `react-hooks/set-state-in-effect` (pola lama, bukan dari perubahan terakhir) | Lint tidak bersih; 7 error diterima | Diminta lint bersih → ubah pola ke "adjust state during render" seperti `appearance-settings.tsx` atau turunkan ke pola event-driven |
