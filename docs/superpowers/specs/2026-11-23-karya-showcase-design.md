# Karya — showcase repositori anggota

Desain fitur. Ditulis 23 November 2026 setelah sesi brainstorming.

## 1. Maksud

Permikomnas Jawa Tengah menaungi puluhan himpunan, dan banyak karya anggota
(kelas, tugas akhir, proyek organisasi) hanya hidup sebagai repo GitHub yang
tidak pernah diketahui orang lain. Fitur ini memberi satu tempat untuk
memajangnya: pengunjung bisa membaca penjelasan, melihat tangkapan layar, lalu
membuka repo aslinya.

Pengirim **tidak perlu punya akun**. Itu keputusan sadar: hambatan terbesar
untuk pengajuan adalah registrasi. Sebagai gantinya, sistem membuatkan satu ID
pelacakan yang diberikan balik ke pengirim, dan setiap kiriman melewati kurasi
admin sebelum tayang.

## 2. Tujuan

- Anggota (atau siapa pun dengan repo yang relevan) bisa mengajukan karya tanpa
  mendaftar, dan langsung menerima ID untuk mengecek statusnya.
- Pengunjung bisa menelusuri karya yang sudah tayang, membaca penjelasannya
  dalam format markdown yang dirender, dan membuka repo.
- Pengunjung bisa memberi like, sebagai sinyal karya mana yang layak dilihat
  lebih dulu.
- Admin mengurasi: satu kiriman hanya tayang kalau admin menyetujuinya.
- Landing punya satu pintu masuk kecil ke karya terbaik.

## 3. Non-tujuan

- Tidak ada akun pengirim, tidak ada halaman "karya saya".
- Tidak ada edit atau kirim ulang atas kiriman yang ditolak. Ditolak berarti
  selesai; cara satu-satunya adalah mengajukan kiriman baru.
- Tidak ada komentar, tidak ada balasan dari admin ke pengirim di dalam aplikasi.
- Tidak ada pengambilan metadata GitHub (bintang, bahasa, dsb).
- Satu foto per karya.
- Tidak ada CRUD untuk halaman S&K: isinya teks statis di kode.

## 4. Anti-tujuan

Sebutkan hal-hal yang membuat fitur ini gagal walaupun secara teknis berjalan:

- Menjadi pintu masuk spam atau konten berbahaya. Kiriman anonim yang dirender
  ke halaman publik adalah permukaan serangan; kalau markdown bisa menyelipkan
  skrip, fitur ini gagal.
- Menampilkan karya yang tidak nyata, tidak bisa dibuka, atau bukan karya
  pengirim.
- Membuat admin kewalahan karena tidak ada cara memilah kiriman masuk.
- Menampilkan angka like yang bisa digelembungkan satu orang dengan klik
  berulang.

## 5. Batasan yang sudah ada di proyek

- Konten markdown **belum ada sama sekali**. Konten berita disimpan sebagai HTML
  dari rich-text editor yang ditulis admin.
- `services/content_common.go:SanitizeHTML` adalah sanitizer berbasis regex, dan
  komentarnya sendiri menyatakan itu bukan pengganti bluemonday serta hanya
  memadai untuk konten dari sumber yang dipercaya. Konten karya datang dari
  pengirim anonim, jadi **tidak boleh** mengandalkan fungsi itu sebagai
  pertahanan utama.
- Upload gambar sudah punya pipeline: `internal/imageutil` memvalidasi magic
  bytes, membatasi 8 MB dan 40 MP, mengecilkan ke sisi terpanjang 1600 px, lalu
  menyimpan WebP. `internal/storageutil.Key` menyusun path object storage.
- Endpoint publik yang menerima kiriman sudah ada presedennya di
  `POST /public/invitations`: honeypot field `website`, limiter per IP, validasi
  isi berkas sebelum menyimpan apa pun.
- Permission diseed lewat migrasi SQL (`INSERT ... ON CONFLICT DO NOTHING`) lalu
  diberikan ke role sistem.
- Section landing yang bisa dimatikan didaftar di dua tempat:
  `services/landing_sections.go:LandingSectionKeys` dan
  `frontend/lib/landing/content.ts:LandingSectionKey`.
- Halaman publik `(public)` sekarang `force-dynamic`, jadi data baru langsung
  terlihat tanpa redeploy.

## 6. Pendekatan yang dipertimbangkan

**A. Markdown dirender di server (Go), raw HTML dimatikan.** Dipilih.
goldmark merender markdown tanpa `WithUnsafe()`, sehingga tag HTML yang diketik
pengirim keluar sebagai teks, bukan elemen. HTML hasilnya seluruhnya buatan
goldmark sendiri, jadi tidak ada jalur XSS dari tag kiriman. Pratinjau di form
memakai endpoint yang sama, sehingga yang dilihat pengirim identik dengan yang
nanti tayang. Biaya: satu dependensi Go.

**B. Render di browser dengan react-markdown.** Ditolak. Menambah 3–4 paket JS,
isi karya tidak ada di HTML pertama (padahal halaman detail ingin dibagikan),
dan aturan render jadi ada di dua tempat.

**C. Menyimpan HTML jadi dan memakai `SanitizeHTML` yang ada.** Ditolak. Itu
tepat kasus yang diperingatkan komentar fungsi tersebut: regex bukan sanitizer
untuk masukan tak dipercaya.

## 7. Model data

Migrasi `20261123160000_karya_showcase.sql` (SQL manual, sesuai konvensi repo:
composite unique dan index dibuat di SQL, bukan lewat tag orm).

### Tabel `karya`

| Kolom | Tipe | Catatan |
|---|---|---|
| `id` | BIGINT PK | dari `orm.BaseModel` |
| `code` | varchar(16) UNIQUE | ID pelacakan, mis. `KRY-7F3K9Q` |
| `title` | varchar(150) | nama karya |
| `author_name` | varchar(150) | nama pengirim, untuk kredit |
| `himpunan_id` | BIGINT FK → himpunan | `ON DELETE RESTRICT`; `HimpunanService.Delete` harus menolak dengan pesan jelas ("masih dipakai karya"), bukan membocorkan error FK Postgres |
| `repo_url` | varchar(512) | sudah dinormalisasi, hanya `https://github.com/<owner>/<repo>` |
| `about_md` | text | wajib, 50–20.000 karakter; markdown mentah dari pengirim |
| `image_url` | varchar(512) | wajib; hasil upload WebP 1600 px |
| `status` | varchar(20) | `review` (default) \| `published` \| `rejected` |
| `review_note` | varchar(500) | alasan admin, opsional, tampil di halaman status |
| `terms_version` | varchar(20) | versi S&K yang dicentang saat mengirim |
| `terms_accepted_at` | timestamptz | waktu centang, diisi server |
| `published_at` | timestamptz NULL | diisi saat dipublish, dikosongkan saat ditolak |
| `like_count` | int default 0 | penghitung denormalisasi |

Index: `idx_karya_public (status, like_count DESC, id)` untuk daftar dan karya
unggulan; `idx_karya_himpunan (himpunan_id)` untuk filter.

Markdown **tidak** disimpan dalam bentuk HTML. Render dilakukan saat dibaca.
Dua sumber (md dan html) yang disimpan bersama pasti akan berbeda suatu hari.

### Like

Tidak ada tabel like dan tidak ada identitas pemberi like. Yang ada hanya kolom
`karya.like_count` dan sebuah endpoint yang menaikkannya. Permintaan pemilik
produk: tampilkan angkanya saja, jangan mengenali siapa yang menekan.

Konsekuensi yang diterima: angka bisa dinaikkan siapa pun dengan menekan
berulang, dan tidak ada cara membedakan satu orang menekan sepuluh kali dari
sepuluh orang menekan sekali. Angka ini dipakai untuk urutan tampil dan
pemilihan karya unggulan, bukan untuk klaim apa pun. Satu-satunya penjaga adalah
limiter sementara per IP (tidak disimpan, hanya untuk menahan skrip), bukan
pengenal pengunjung.

## 8. Status

```
           submit
             │
             ▼
          ┌──────┐   admin publish   ┌───────────┐
          │review│──────────────────▶│ published │
          └──────┘                   └───────────┘
             │                         │      ▲
             │ admin reject            │ admin reject (takedown)
             ▼                         ▼      │
          ┌──────────┐            ┌──────────┐│
          │ rejected │            │ rejected │┘
          └──────────┘            └──────────┘
```

- Kiriman baru selalu `review`.
- `published` mengisi `published_at`, `rejected` mengosongkannya.
- Hanya `published` yang bisa di-like dan muncul di endpoint publik.
- `rejected` bersifat final dari sisi pengirim. Tidak ada alur edit; mengajukan
  lagi berarti kiriman baru dengan ID baru.

## 9. Endpoint

### Publik (tanpa login)

| Method | Path | Perilaku |
|---|---|---|
| POST | `/public/karya` | multipart: `title`, `author_name`, `himpunan_id`, `repo_url`, `about_md`, `image`, plus honeypot `website`. Sukses → `{code}`. |
| POST | `/public/karya/preview` | JSON `{about_md}` → `{html}`. Untuk pratinjau di form. |
| GET | `/public/karya` | hanya `published`. Query `himpunan_id`, `sort=likes\|new`, `limit`, `offset`. Default `likes`: `like_count DESC, id ASC`. |
| GET | `/public/karya/featured` | satu karya `published` untuk landing, atau `null`. Aturan sama dengan default sort. |
| GET | `/public/karya/:code` | detail `published` + `html` hasil render. 404 bila bukan published. |
| GET | `/public/karya/status/:code` | `{code, title, status, review_note, created_at, published_at}`. Tidak mengembalikan isi karya. |
| POST | `/public/karya/:code/like` | 404 bila bukan published. Balikan `{like_count}` setelah dinaikkan. Tidak ada identitas, tidak ada status "sudah like". |

Urutan pendaftaran route: path statis (`/public/karya/featured`,
`/public/karya/preview`, `/public/karya/status/:code`) **sebelum** dinamis
(`/public/karya/:code`), karena router mencocokkan berurutan.

### Admin

| Method | Path | Permission |
|---|---|---|
| GET | `/karya` | `karya.manage`, query `?status=review\|published\|rejected` |
| PUT | `/karya/:id` | `karya.manage`, body `{status, review_note}` |
| DELETE | `/karya/:id` | `karya.manage` |

Permission `karya.manage` (module `karya`) diseed di migrasi **dan** di
`internal/seed/seed.go:permissionDefs` (dua mekanisme itu sama-sama hidup saat
boot), lalu diberikan ke role `is_system` saja, mengikuti pola
`press_release.manage`/`merch.manage`.

## 10. Keamanan

Kiriman datang dari internet tanpa autentikasi, jadi diperlakukan sebagai
masukan bermusuhan.

**Markdown → HTML**
- goldmark tanpa `WithUnsafe()`. Raw HTML yang diketik pengirim keluar sebagai
  teks.
- Link renderer hanya meloloskan skema `http`, `https`, `mailto`. Atribut
  `rel="nofollow noopener ugc"` dan `target="_blank"`.
- Batas ukuran `about_md` 20.000 karakter.
- Sebagai lapis kedua, HTML hasil render tetap dilewatkan `SanitizeHTML`.

**Link repo**
- Wajib `https://github.com/<owner>/<repo>`, tanpa userinfo, port, atau query.
  Segmen owner/repo hanya `[A-Za-z0-9._-]`, akhiran `.git` dibuang.
- Tidak ada request keluar ke URL kiriman. Mengambil metadata berarti server
  kita dijadikan proxy untuk URL apa pun yang dikirim anonim (SSRF).

**Gambar**
- Magic bytes lewat `imageutil` (bukan MIME dari browser), batas 8 MB dan 40 MP,
  dikecilkan ke 1600 px, disimpan WebP di `karya/`.

**Penyalahgunaan**
- Honeypot `website`: terisi berarti bot. Balas sukses palsu, jangan simpan.
- Limiter per IP: 3 kiriman/jam, 60 pratinjau/jam. Pola sama dengan
  `invitationLimiter` (map + jendela waktu + pembersihan berkala).
- ID pelacakan dari `crypto/rand`, 6 karakter alfabet tanpa `0/O/1/I`, prefiks
  `KRY-`. Bukan nomor urut, supaya status kiriman lain tidak bisa ditebak.
- Like: tanpa identitas. Limiter per IP (60/jam, tidak disimpan) hanya untuk
  menahan skrip, bukan untuk mengenali pengunjung. Angka bisa dinaikkan
  berulang; itu konsekuensi yang diterima (lihat §7).

**Kebocoran data**
- Halaman status hanya mengembalikan status, judul, dan catatan admin. Markdown,
  gambar, dan IP tidak pernah keluar lewat jalur ini.

## 11. Frontend

| Rute | Isi |
|---|---|
| `/karya` | katalog kartu (gambar, judul, pengirim, himpunan, jumlah like), filter himpunan, tautan "Kirim karya" dan tautan S&K di kaki halaman |
| `/karya/[code]` | detail: gambar, judul, pengirim + himpunan, tombol like, tombol "Buka repo", isi markdown yang sudah dirender |
| `/karya/kirim` | form + pratinjau markdown (debounce ~600 ms ke `/public/karya/preview`), dropdown himpunan dari `GET /public/himpunan`, unggah satu gambar (wajib), centang "Saya menyetujui Syarat & Ketentuan" bertaut ke `/karya/snk` (wajib), honeypot tersembunyi, setelah sukses tampilkan ID besar + tombol salin |
| `/karya/status` | input ID → status, catatan admin, dan tanggal |
| `/karya/snk` | syarat & ketentuan, statis |

Landing:
- Section baru `karya`: satu kartu karya unggulan (gambar, judul, pengirim,
  like) + dua tautan: "Lihat semua karya" dan "Kirim karya".
- Kunci section `karya` ditambahkan ke `LandingSectionKeys` (Go) dan
  `LandingSectionKey` (TS), sehingga bisa dimatikan dari pengaturan landing
  seperti section lain.
- Navigasi: item "Karya" → `/karya`, selalu tampil (seperti Program dan Berita,
  yang merupakan halaman sendiri).

Admin:
- `/admin/karya`: tabel dengan filter status, tombol **Publish** dan **Tolak**
  (menolak membuka dialog isian catatan), serta pratinjau isi markdown.

## 12. Syarat & Ketentuan (isi awal)

Ditulis general, bukan aturan teknis. Teks final boleh disunting tanpa
menyentuh kode, asalkan tetap di satu berkas. Versi teks (mis. `2026-11-23`)
naik setiap isinya berubah, dan versi itu ikut disimpan di tiap kiriman bersama
waktu persetujuannya.

1. Karya yang diajukan adalah karya sendiri atau karya yang kamu punya hak
   untuk mempublikasikannya, bukan salinan tanpa perubahan berarti.
2. Repositori bersifat publik dan bisa dibuka tanpa login, tanpa permintaan
   akses.
3. Repositori tidak memuat kredensial, API key, token, atau data pribadi orang
   lain.
4. Tidak memuat konten yang melanggar hukum, menyerang pihak lain, atau berisi
   malware dan alat untuk merusak sistem.
5. Pustaka, aset, dan kode pihak ketiga dipakai sesuai lisensinya dan disebutkan
   sebagaimana mestinya.
6. Judul, penjelasan, dan gambar mewakili karya secara jujur.
7. Gambar yang diunggah adalah milik pengirim atau berlisensi bebas, dan tidak
   menampilkan orang lain tanpa izin.
8. Kiriman ditinjau pengurus sebelum tayang. Pengurus dapat menolak atau
   menurunkan karya yang tidak memenuhi ketentuan ini, dengan atau tanpa
   pemberitahuan rinci.
9. Satu karya satu pengajuan. Kiriman ganda atau spam ditolak.
10. Permikomnas tidak mengklaim hak cipta atas karya. Yang ditampilkan adalah
    tautan dan ringkasan, dan karya akan dihapus dari showcase bila pemiliknya
    meminta.

## 13. Keputusan yang diambil penulis desain

Dicatat supaya bisa dikoreksi saat membaca, bukan dianggap sudah disetujui.

1. **Dua field nama**: `title` (nama karya) dan `author_name` (nama pengirim).
   Permintaan awal menyebut satu "nama", tetapi karya butuh judul dan kredit
   butuh nama orang, sedangkan `asal himpunan` jelas merujuk ke orangnya.
2. **Himpunan sebagai relasi**, dipilih dari daftar resmi lewat
   `GET /public/himpunan`, bukan teks bebas. Alasannya sama dengan keputusan
   `user.himpunan_id`: teks bebas membuat satu himpunan muncul dalam beberapa
   ejaan dan filter jadi tidak akurat. Himpunan yang belum terdaftar ditambahkan
   admin lebih dulu lewat `/admin/himpunan`.
3. **`review_note` ada**, meski pengirim tidak bisa memperbaiki kirimannya.
   Menolak tanpa alasan membuat orang mengulang kesalahan yang sama.
4. **`like_count` disimpan sebagai kolom**, bukan dihitung dari tabel like,
   karena hanya ada angka. Tidak ada tabel like dan tidak ada identitas pemberi
   like, sesuai permintaan pemilik produk: yang tampil hanya angka.
5. **Urutan karya unggulan** `like_count DESC, id ASC`: memenuhi "yang likenya
   terbanyak" sekaligus "kiriman pertama" ketika belum ada like sama sekali.
6. **Ditolak bersifat final.** Mengajukan ulang berarti kiriman baru dengan ID
   baru, sesuai keputusan pada sesi desain.
7. **S&K statis di kode**, bukan dikelola lewat admin. Isinya aturan general yang
   jarang berubah; kalau nanti perlu diubah admin, itu pekerjaan terpisah.
8. **Foto wajib.** Katalog yang kartunya tanpa gambar akan terlihat seperti daftar
   tautan biasa, padahal inti fitur ini adalah memajang. Pengirim tanpa
   tangkapan layar tinggal mengambilnya dari repo.
9. **Deskripsi wajib minimal 50 karakter**, supaya kartu di katalog tidak kosong.
10. **Persetujuan S&K dicatat** (`terms_version` + `terms_accepted_at`), karena §12
    membebankan kewajiban ke pengirim. Tanpa catatan, aturan itu hanya hiasan.
11. **Himpunan tidak bisa dihapus selama masih dipakai karya** (`RESTRICT` +
    pesan jelas), mengikuti sifat data karya yang tidak boleh kehilangan
    atribusi. Berbeda dari `user.himpunan_id` yang memakai `SET NULL`, karena
    kehilangan asal himpunan pada karya berarti kartunya kehilangan keterangan
    utama.
12. **`published_at` dikosongkan saat takedown** dan diisi lagi saat dipublish
    ulang, sehingga karya yang kembali tayang muncul di urutan teratas
    `sort=new`. Disengaja: publikasi ulang memang peristiwa baru.
13. **Sitemap dan OG image tidak diikutkan** pada iterasi ini. Halaman detail
    tetap punya `title`/`description` dinamis (nyaris gratis lewat
    `generateMetadata`), tetapi memasukkan karya ke `sitemap.xml` mengubah
    sitemap dari fungsi statis menjadi route yang memanggil backend, dan itu
    pekerjaan tersendiri.

## 14. Yang diserahkan ke builder

- Kalimat dan tata letak S&K (isi pokoknya di §12).
- Nilai pasti rate limit, ukuran halaman katalog, dan batas panjang judul.
- Gaya visual kartu dan halaman detail, mengikuti sistem landing yang ada.
- Apakah detail karya memakai halaman sendiri atau panel di `/karya`
  (desain ini mengasumsikan halaman sendiri agar bisa dibagikan).
- Cara menampilkan 404 dan empty state katalog.
- Teks dan mekanisme penolakan pada `HimpunanService.Delete` ketika himpunan
  masih dipakai karya.
- Isi `generateMetadata` untuk halaman detail karya.

## 15. Rencana verifikasi

Backend (`go test`):
- Validasi `repo_url`: terima bentuk benar, tolak host lain, userinfo, query,
  dan path bukan `owner/repo`.
- Render markdown: `<script>` dan `<img onerror>` pada masukan keluar sebagai
  teks, bukan elemen; link `javascript:` hilang.
- Transisi status: publish mengisi `published_at`, reject mengosongkannya dan
  mengeluarkan karya dari daftar publik.
- Like: dua panggilan menaikkan `like_count` dua kali (tanpa dedupe), dan
  limiter menolak panggilan setelah batas per jam tercapai.
- Kiriman tanpa gambar, tanpa centang S&K, atau dengan deskripsi < 50 karakter
  ditolak, dan `terms_version`/`terms_accepted_at` terisi pada kiriman yang sah.
- `HimpunanService.Delete` menolak dengan pesan yang bisa dibaca admin ketika
  himpunan masih dipakai karya.
- Generator kode: format `KRY-` + 6 karakter, tidak ada karakter ambigu.

Frontend (`pnpm lint`, `tsc --noEmit`, `pnpm build`) dan uji manual di browser:
kirim karya → ID muncul → admin publish → karya tampil di `/karya` dan menjadi
unggulan di landing → like menambah angka yang tampil di kartu dan halaman
detail → halaman status menampilkan "review" untuk kiriman yang belum
dikurasi.