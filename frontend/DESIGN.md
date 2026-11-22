---
version: alpha
name: PERMIKOMNAS Jawa Tengah
description: PERMIKOMNAS Jawa Tengah adalah Perhimpunan Mahasiswa Informatika dan Komputer Nasional Wilayah VII Jawa Tengah. Organisasi ini menghimpun seluruh himpunan informatika , komputer dan sebagainya dengan tujuan untuk memajukan teknologi dan menjadi garda terdepan dalam perkembangan teknologi di jawa tengah. PERMIKOMNAS Jawa Tengah di kelola oleh Badan Pengurus Wilayah, anggota nya terdiri dari mahasiswa mahasiswa dari berbagai himpunan yang tergabung dalam PERMIKOMNAS Jawa Tengah
colors:
  primary: "#004fa1"
  secondary: "#848fbb"
  muted: "#454f75"
  text: "#f1f1e6"
  text-dim: "#e8ebe2"
  neutral: "#ffffff"
typography:
  h1:
    fontFamily: Public Sans
    fontSize: clamp(2.5rem, 6vw, 4.5rem)
    fontWeight: 700
  body-md:
    fontFamily: Public Sans
    fontSize: 1rem
    fontWeight: 400
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 0.75rem
    fontWeight: 600
rounded:
  sm: 4px
  md: 8px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 20px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
---

# PERMIKOMNAS Jawa Tengah

## Overview

Architectural minimalism meets journalistic gravitas. The UI evokes a premium matte finish — a high-end broadsheet or contemporary gallery.

## Colors

The palette is rooted in semantic tokens. Use the role (e.g. `{colors.primary}`) — never the hex literal — when authoring components.

- **primary (#004fa1)**
- **secondary (#848fbb)** — hanya untuk garis rambut/hairline; sebagai teks 12px ia gagal APCA (Lc 59)
- **muted (#454f75)** — pengganti yang lolos gate untuk semua label caps di atas kertas (Lc 79 di parchment, 87 di putih)
- **text (#f1f1e6)**
- **text-dim (#e8ebe2)** — teks di atas bidang biru; jangan pakai `opacity`, 0.9 saja sudah gagal (Lc 71)
- **neutral (#ffffff)** Use this color for background color

## Typography

| Token | Font | Size | Weight |
| --- | --- | --- | --- |
| `h1` | Public Sans | `clamp(2.5rem, 6vw, 4.5rem)` | 700 |
| `body-md` | Public Sans | 1rem | 400 |
| `label-caps` | Space Grotesk | 0.75rem | 600 |

Judul hero memakai rentang clamp, bukan satu ukuran tetap: di desktop ia harus
mendominasi halaman (>= 3x ukuran body), di ponsel turun ke 2.5rem. Judul
section tetap `text-3xl md:text-4xl`.

## Layout

Spacing scale (use the named scale; avoid arbitrary values):

- `spacing.sm` — 8px
- `spacing.md` — 16px
- `spacing.lg` — 24px

**Motion.** Satu gerakan orkestrasi saat halaman dimuat (hero, `animate-fade-in-up`
bertahap 90ms) plus scroll reveal dua arah untuk section di bawahnya: elemen
masuk naik kalau datang dari bawah dan turun kalau datang dari atas, lalu
terpicu ulang saat pengunjung scroll balik. Transisi hanya `opacity` +
`transform`, dipicu `IntersectionObserver` (`components/landing/scroll-reveal.tsx`),
dan mati total saat `prefers-reduced-motion`. Header lengket, jadi anchor
section punya `scroll-margin-top`.

## Elevation & Depth

Depth is conveyed through tonal layering and subtle borders rather than drop shadows. Cards lift from the warm neutral background through pure-white surfaces and a single hairline border.

## Shapes

Corner radius scale:

- `rounded.sm` — 4px
- `rounded.md` — 8px

## Components

### button-primary
- backgroundColor: `{colors.primary}`
- textColor: `{colors.text}`
- rounded: `{rounded.sm}`
- padding: `12px 20px`

### card
- backgroundColor: `{colors.primary}`
- textColor: `{colors.text}`
- rounded: `{rounded.md}`
- padding: `20px`

### input
- backgroundColor: `{colors.neutral}`
- textColor: `{colors.primary}`
- rounded: `{rounded.sm}`
- padding: `10px 14px`

## Do's and Don'ts

- Do use the tertiary color sparingly — only for the highest-emphasis action.
- Do reserve satu elemen tanda per halaman (landing: angka wilayah raksasa di hero).
- Don't pakai `opacity` pada teks di atas bidang biru — pakai `{colors.text-dim}`.
- Don't combine more than two type families on a single screen.
- Don't use full-width images without a generous bottom margin.
- Do default to the warm neutral background; reserve pure white for cards.

## This Design MD just using for landing page app
## Landing rework (2026-11-21)

- **Route group `(public)`**: `/` (landing), `/berita`, `/berita/[slug]`, `/merch`, `/undangan` berbagi `app/(public)/layout.tsx` — header pil melayang (menu layar penuh di < lg), footer wordmark, Lenis smooth scroll (`smooth-scroll.tsx`, digerakkan ticker GSAP), kursor kustom (`custom-cursor.tsx`, pointer presisi saja), dan `landing-motion.tsx` (satu gsap.context, kosakata `data-*` didokumentasikan di file itu, dijalankan ulang per pathname).
- **Palet** tetap dari logo: indigo `--landing-ink`, merah, cyan; hijau hanya aksen gradien. Tombol/teks putih di atas merah memakai `--landing-accent-deep` (#c8202a, 5.7:1) — `--landing-accent` (#ed3237) hanya untuk teks display besar/dekorasi (4.1:1).
- **Hero**: kanvas 2D jaringan kota Jawa Tengah (`network-canvas.tsx`, koordinat di `lib/landing/content.ts#cityNodes`), berhenti saat di luar viewport/tab tersembunyi.
- **Konten CRUD**: Press release & merch diambil server-side via `lib/landing/fetch.ts` (revalidate 60 dtk, gagal → empty state, landing tidak ikut error). Kontrak tipe di `lib/public-content.ts`; admin di `/admin/press-releases` & `/admin/merch` (permission `press_release.manage`, `merch.manage`).
- **Reduced motion**: Lenis, kursor, kanvas loop, dan semua tween GSAP tidak dipasang; konten langsung di posisi akhir.
- **Himpunan anggota** (2026-11-21): data landing = `docs/Daftar Himpunan.pdf` (45 himpunan, 20 kota) di `lib/landing/content.ts#himpunanList`; logo diekstrak ke `public/assets/himpunan/NN.webp`. Placeholder lama dihapus. Koreksi atas PDF dicatat di komentar `himpunanList`.
- Section dengan elemen `sticky` memakai `overflow-clip`, bukan `overflow-hidden` (yang terakhir menjadikan section scroll container sehingga sticky mati).

## Portal Pengurus (satu portal, RBAC)

- **Satu shell, satu dashboard.** `app/(member)/layout.tsx` dan `app/(admin)/layout.tsx` sama-sama memakai `components/portal-shell.tsx` (SidebarProvider + `AppSidebar` + SidebarInset), jadi sidebar identik di semua halaman. Tidak ada lagi switch "Panel Admin"/"Panel Anggota" maupun prop `menuVariant`. Brand sidebar: "Portal Pengurus", logo -> `/dashboard`.
- **URL tidak berubah** (`(member)/...` dan `(admin)/admin/...`). `/admin` dan `/admin/dashboard` hanya `redirect("/dashboard")`. Dashboard tunggal: `app/(member)/dashboard/page.tsx` (server, data personal) -> `components/dashboard/portal-dashboard.tsx` (client, data pengelolaan sesuai permission). Kartu/stat/aksi cepat tanpa permission tidak dirender.
- **Navigasi** = `portalNav: NavGroup[]` di `lib/nav-config.tsx` (grup: Dashboard, Kegiatan, Kehadiran & Disiplin, Komunikasi, Organisasi, Kelola). Aturan `filterNav(groups, hasPermission)`: (a) item/sub-item ber-`permission` (string atau any-of array) disembunyikan bila tidak dimiliki; (b) induk tanpa sub-item terlihat disembunyikan; (c) induk dengan tepat satu sub-item terlihat diratakan jadi tautan langsung ke sub-item itu (judul + ikon induk dipertahankan); (d) grup kosong disembunyikan. Aktif = longest-prefix match (`findActiveUrl`), induk dari sub-item aktif terbuka. Menu Keuangan tetap di bawah flag `FEATURES.finance`.
- Rekrutmen belum masuk nav: `/admin/recruitments` hanya redirect (modul dihapus).
- Kalender jadwal tidak lagi di dashboard (tetap di `/events`).

## Auth & Sesi (cookie HttpOnly, 2026-11-22)

- Token JWT **tidak pernah** dipegang JS: tidak ada `localStorage` (`myorg_token` lama dihapus saat app load / login) dan tidak ada `document.cookie`.
- `lib/auth.ts` `login()`/`register()`/`logout()` → `POST /api/session/{login,register,logout}` (route handler di `app/api/session/*`, helper `lib/session/server.ts`). Handler meneruskan ke backend (`API_INTERNAL_URL ?? http://127.0.0.1:8080`), set cookie `token` HttpOnly + SameSite=Lax + Path=/ + Max-Age 7 hari (+ Secure di production), dan menghapus `token` dari envelope JSON. Status/envelope error backend diteruskan apa adanya.
- Status login di `AuthProvider` diturunkan dari `GET /me` (401 → user null), bukan dari keberadaan token.
- `proxy.ts` mencakup `/api/backend/:path*`: write (non GET/HEAD/OPTIONS) dengan header `Origin` beda host → 403 `{success:false,message:"origin tidak valid"}`; bila ada cookie `token` dan tanpa header `Authorization`, request diteruskan dengan `Authorization: Bearer <cookie>`. Override header ini diterapkan ke request sebelum rewrite eksternal di `next.config.ts` (lihat `next/dist/server/lib/router-utils/resolve-routes.js`), jadi rewrite tetap dipakai — tidak ada catch-all handler.
- Semua fetch browser (termasuk upload multipart, export CSV, restore backup) cukup same-origin `/api/backend/...` + `credentials: "include"`; jangan bangun header `Authorization` manual.
- **Direct API mode** (`NEXT_PUBLIC_USE_DIRECT_API=1`) tidak lagi dipakai untuk panggilan API: cookie HttpOnly milik origin Next tidak bisa dibawa ke host backend. Variabel itu hanya memengaruhi URL storage (`lib/storage-url.ts`).
