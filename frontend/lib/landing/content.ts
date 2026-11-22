/**
 * Konten statis landing page. Semua teks dan daftar di sini — perbarui
 * keanggotaan/pengurus saat data resmi berubah, tanpa menyentuh komponen.
 */

export const org = {
  name: "PERMIKOMNAS Jawa Tengah",
  fullName:
    "Perhimpunan Mahasiswa Informatika dan Komputer Nasional",
  region: "Wilayah VII Jawa Tengah",
  email: "sekretaris@permikomnasjateng.or.id",
  address: "Semarang, Jawa Tengah, Indonesia",
  description:
    "Perhimpunan Mahasiswa Informatika dan Komputer Nasional Wilayah VII Jawa Tengah menghimpun himpunan mahasiswa informatika dan komputer dari berbagai kampus di Jawa Tengah untuk memajukan teknologi dan menjadi garda terdepan perkembangan teknologi di Jawa Tengah.",
} as const

export type LandingSectionKey =
  | "about"
  | "programs"
  | "press"
  | "members"
  | "officials"
  | "merch"
  | "invitation"
  | "cta"

export type NavLink = { label: string; href: string; section?: LandingSectionKey }

/** `section`: tautan ikut disembunyikan bila toggle section-nya dimatikan. Berita dan Program = halaman sendiri (/berita, /program), selalu tampil. */
export const navLinks: readonly NavLink[] = [
  { label: "Tentang", href: "/#tentang", section: "about" },
  { label: "Program", href: "/program" },
  { label: "Berita", href: "/berita" },
  { label: "Jaringan", href: "/#himpunan", section: "members" },
  { label: "Anggota", href: "/anggota", section: "members" },
  { label: "Pengurus", href: "/#pengurus", section: "officials" },
  { label: "Merch", href: "/merch", section: "merch" },
  { label: "Undangan", href: "/undangan", section: "invitation" },
]

export const hero = {
  eyebrow: "Perhimpunan Mahasiswa Informatika dan Komputer Nasional",
  title: "Maju Bersama Teknologi",
  subtitle:
    "Wilayah VII PERMIKOMNAS mewadahi himpunan mahasiswa informatika dan komputer lintas kampus di Jawa Tengah. Berjejaring, berkiprah, dan bertumbuh bersama dalam satu perhimpunan.",
  primaryCta: { label: "Lihat program kerja", href: "/program" },
  secondaryCta: { label: "Kenali pengurus", href: "/#pengurus" },
} as const

export const aboutFacts = [
  {
    term: "Nama",
    detail: "Perhimpunan Mahasiswa Informatika dan Komputer Nasional",
  },
  { term: "Wilayah", detail: "VII — Jawa Tengah" },
  {
    term: "Pengelola",
    detail: "Badan Pengurus Wilayah, dipilih dari anggota himpunan",
  },
  {
    term: "Keanggotaan",
    detail: "Himpunan mahasiswa informatika, komputer, dan sejenisnya",
  },
  {
    term: "Fokus",
    detail:
      "Pemersatu gerakan mahasiswa teknologi dan akselerasi talenta digital daerah",
  },
] as const

export const aboutParagraphs = [
  "PERMIKOMNAS Jawa Tengah di kelola oleh Badan Pengurus Wilayah. Anggotanya terdiri dari mahasiswa-mahasiswa dari berbagai himpunan yang tergabung dalam PERMIKOMNAS Jawa Tengah.",
  "Kami percaya kemajuan teknologi tidak berhenti di satu kampus. Dengan menghimpun himpunan dari berbagai kota di Jawa Tengah, kami membangun jaringan yang berbagi ilmu, sumber daya, dan panggung bagi mahasiswa.",
] as const

export type WorkProgram = {
  slug: string
  name: string
  description: string
  cadence: string
  category: "program_kerja" | "agenda"
  status: "upcoming" | "done"
  division_name: string
  /** "YYYY-MM-DD" atau null. */
  start_date: string | null
  end_date: string | null
  location: string
  host: string
}

const programBase = {
  category: "program_kerja",
  status: "upcoming",
  division_name: "",
  start_date: null,
  end_date: null,
  location: "",
  host: "",
} as const

/** Fallback statis bila API program kerja tidak terjangkau. */
export const programs: WorkProgram[] = [
  {
    ...programBase,
    slug: "kongres-wilayah",
    name: "Kongres Wilayah",
    description:
      "Musyawarah tertinggi antar-himpunan: evaluasi periode, arah gerakan, dan pemilihan Badan Pengurus Wilayah.",
    cadence: "Tahunan",
  },
  {
    ...programBase,
    slug: "seminar-dan-kajian-teknologi",
    name: "Seminar dan Kajian Teknologi",
    description:
      "Pembicara dari industri dan akademisi membahas tren teknologi terkini untuk mahasiswa seluruh Jawa Tengah.",
    cadence: "Semesteran",
  },
  {
    ...programBase,
    slug: "kompetisi-antar-kampus",
    name: "Kompetisi Antar-Kampus",
    description:
      "Panggung lomba pemrograman, keamanan, dan inovasi digital yang mempertemukan talenta dari tiap himpunan anggota.",
    cadence: "Tahunan",
  },
  {
    ...programBase,
    slug: "pelatihan-dan-sertifikasi",
    name: "Pelatihan dan Sertifikasi",
    description:
      "Kelas intensif dan program sertifikasi bersama mitra untuk memperkuat kesiapan kerja anggota.",
    cadence: "Berkelanjutan",
  },
  {
    ...programBase,
    slug: "kolaborasi-riset",
    name: "Kolaborasi Riset",
    description:
      "Wadah kolaborasi riset dan pengabdian antar-himpunan lintas kampus dalam satu wilayah.",
    cadence: "Per periode",
  },
]

export type Himpunan = {
  no: number
  name: string
  institution: string
  city: string
  /** Daerah 1-6; 0/undefined = belum ditentukan. */
  region?: number
  address: string | null
  email: string | null
  logo: string | null
  /** Label pendek dari API; bila undefined (data statis) dipakai peta `shortLabel`. */
  shortLabel?: string
}

/**
 * Himpunan anggota — sumber: docs/Daftar Himpunan.pdf ("Daftar Himpunan
 * PERMIKOMNAS Jawa Tengah 2025"). Logo diekstrak dari PDF yang sama ke
 * public/assets/himpunan/NN.webp (NN = nomor urut PDF; no. 28 tanpa logo).
 *
 * Penyesuaian dari PDF (bukan karangan):
 *  - no. 12 tertulis "HIMATIF UNS" padahal instansi & email UMS → "HIMATIF UMS".
 *  - no. 4 & 40: kolom email berisi domain, bukan alamat email → null.
 *  - no. 23: kolom alamat berisi nama himpunan → null.
 *  - no. 17/22/38: email mengikuti teks yang tampil di PDF (bertanda "-").
 *  - `city` disimpulkan dari alamat, dipakai untuk peta & pengelompokan.
 */
export const himpunanList: Himpunan[] = [
  { no: 1, name: "HIMA ILKOM UNNES", institution: "Universitas Negeri Semarang", city: "Semarang", address: "Gd. PKM FMIPA UNNES Kampus Sekaran, Semarang 50229", email: "himailkomunnes@gmail.com", logo: "/assets/himpunan/01.webp" },
  { no: 2, name: "HMTI UDINUS", institution: "Universitas Dian Nuswantoro", city: "Semarang", address: "Gedung D Lantai 1 Universitas Dian Nuswantoro, Jalan Nakula 1 No. 5-11, Semarang", email: "hmti.udinus@gmail.com", logo: "/assets/himpunan/02.webp" },
  { no: 3, name: "HMDTI", institution: "Universitas Dian Nuswantoro", city: "Semarang", address: "Gedung D.4.18 Universitas Dian Nuswantoro, Jalan Nakula 1 No. 5-11, Semarang", email: "hmdti.dinus@gmail.com", logo: "/assets/himpunan/03.webp" },
  { no: 4, name: "HMJTI", institution: "Universitas Wahid Hasyim", city: "Semarang", address: "Jl. Gunungpati Raya No. 15, Nongkosawit, Kec. Gn. Pati, Kota Semarang, Jawa Tengah 50224", email: null, logo: "/assets/himpunan/04.webp" },
  { no: 5, name: "HIMA TI UNW", institution: "Universitas Ngudi Waluyo", city: "Ungaran", address: "Gedung Graha Kridha Cendekia Universitas Ngudi Waluyo, Jl. Diponegoro No. 186, Mijen, Gedanganak, Kec. Ungaran Timur, Semarang 50512", email: "himati.unw@gmail.com", logo: "/assets/himpunan/05.webp" },
  { no: 6, name: "HIMFORMA UPGRIS", institution: "Universitas PGRI Semarang", city: "Semarang", address: "Gedung PKM Lt. 1, Jalan Lontar No. 1, Sidodadi Timur, Semarang", email: "himainformatika@upgris.ac.id", logo: "/assets/himpunan/06.webp" },
  { no: 7, name: "HM-TIF UNISSULA", institution: "Universitas Sultan Agung", city: "Semarang", address: "Gedung FTI UNISSULA, Jl. Raya Kaligawe, Terboyo Kulon, Kec. Genuk, Kota Semarang, Jawa Tengah 50112", email: "hmj.informatika@unissula.ac.id", logo: "/assets/himpunan/07.webp" },
  { no: 8, name: "HMPS-TI UNISBANK", institution: "Universitas Stikubank Semarang", city: "Semarang", address: "Jalan Kendeng V, Bendan Ngisor, Semarang, UNISBANK Kampus Kendeng", email: "hmpsti.unisbanksmg@gmail.com", logo: "/assets/himpunan/08.webp" },
  { no: 9, name: "HMIF UNDIP", institution: "Universitas Diponegoro", city: "Semarang", address: "Gedung E Lantai 3, Kampus FSM UNDIP, Jalan Prof. Soedarto, S.H., Tembalang, Semarang 50275", email: "hm@if.undip.ac.id", logo: "/assets/himpunan/09.webp" },
  { no: 10, name: "HIMASKOM UNDIP", institution: "Universitas Diponegoro", city: "Semarang", address: "Ruang D301, Lt. 3 Gedung Kuliah Bersama, Jl. Prof. Soedarto, Universitas Diponegoro, Semarang", email: "himaskom@himaskom.undip.ac.id", logo: "/assets/himpunan/10.webp" },
  { no: 11, name: "HIMAFOR UNIMUS", institution: "Universitas Muhammadiyah Semarang", city: "Semarang", address: "Jalan Kedungmundu No. 18, Kedungmundu, Kec. Tembalang, Kota Semarang", email: "himafor21@gmail.com", logo: "/assets/himpunan/11.webp" },
  { no: 12, name: "HIMATIF UMS", institution: "Universitas Muhammadiyah Surakarta", city: "Surakarta", address: "Gedung J Lantai 3 Sayap Utara FIKOM Universitas Muhammadiyah Surakarta, Surakarta", email: "himatif@ums.ac.id", logo: "/assets/himpunan/12.webp" },
  { no: 13, name: "HIMASTER UNS", institution: "Universitas Sebelas Maret", city: "Surakarta", address: "Gedung A, Lt. 1 FMIPA UNS, Jalan Ir. Sutami 36 A Kentingan, Surakarta 57126", email: "himaster.mipa@gmail.com", logo: "/assets/himpunan/13.webp" },
  { no: 14, name: "MIKROPTIK UNS", institution: "Universitas Sebelas Maret", city: "Surakarta", address: "Jalan Ahmad Yani No. 200, Pabelan, Kartasura", email: "mikroptik@fkip.uns.ac.id", logo: "/assets/himpunan/14.webp" },
  { no: 15, name: "EMAILKOMP UNS", institution: "Universitas Sebelas Maret", city: "Surakarta", address: "Gedung A, Lt. 1 FMIPA UNS, Jalan Ir. Sutami 36 A Kentingan, Surakarta 57126", email: "emailkomp.mipa@uns.ac.id", logo: "/assets/himpunan/15.webp" },
  { no: 16, name: "HMP S1 TI UKSW", institution: "Universitas Kristen Satya Wacana", city: "Salatiga", address: "FTI Universitas Kristen Satya Wacana, Blotongan, Salatiga 50715", email: "fti.hmp.s1.ti@adm.uksw.edu", logo: "/assets/himpunan/16.webp" },
  { no: 17, name: "HIMAPRO-TI UMK", institution: "Universitas Muria Kudus", city: "Kudus", address: "Gedung I Lantai 1 UMK, Jalan Gondang Manis, PO BOX 53, Bae, Kudus", email: "himapro-ti@umk.ac.id", logo: "/assets/himpunan/17.webp" },
  { no: 18, name: "HMPSIF UNISNU", institution: "Universitas Islam Nahdlatul Ulama", city: "Jepara", address: "UNISNU, Jalan Taman Siswa (Pekeng), Tahunan, Jepara", email: "hmpsif@unisnu.ac.id", logo: "/assets/himpunan/18.webp" },
  { no: 19, name: "HIMTI UNSIQ", institution: "Universitas Sains Al-Qur'an Wonosobo", city: "Wonosobo", address: "Lantai Dasar Gedung FASTIKOM, UNSIQ, Wonosobo", email: "himtifastikom@gmail.com", logo: "/assets/himpunan/19.webp" },
  { no: 20, name: "HMIF UNSOED", institution: "Universitas Jenderal Soedirman", city: "Purbalingga", address: "Gedung UKM Kampus FT UNSOED, Jalan Mayjend Soengkono Km. 5, Blater, Purbalingga", email: "soedirmatif@gmail.com", logo: "/assets/himpunan/20.webp" },
  { no: 21, name: "HMTI UMP", institution: "Universitas Muhammadiyah Purwokerto", city: "Purwokerto", address: "Mabes HMPS FTS UMP, Kampus 1, Jalan Raya Dukuhwaluh, Purwokerto 53182, Jawa Tengah", email: "hmti@ump.ac.id", logo: "/assets/himpunan/21.webp" },
  { no: 22, name: "HMIF", institution: "Telkom University Purwokerto", city: "Purwokerto", address: "Jalan D.I. Panjaitan No. 123, Purwokerto, Jawa Tengah", email: "hmif@ittelkom-pwt.ac.id", logo: "/assets/himpunan/22.webp" },
  { no: 23, name: "HIMATEKNO UMPR", institution: "Universitas Muhammadiyah Purworejo", city: "Purworejo", address: null, email: "himatekno@gmail.com", logo: "/assets/himpunan/23.webp" },
  { no: 24, name: "HMJ TI UINWS", institution: "Universitas Islam Negeri Walisongo Semarang", city: "Semarang", address: "Jalan Ngepos 3, RT/RW 01/01, Kel. Jerakah, Tugu, Semarang, Jawa Tengah", email: "uinws.ti@gmail.com", logo: "/assets/himpunan/24.webp" },
  { no: 25, name: "HIMANIFO UNIMMA", institution: "Universitas Muhammadiyah Magelang", city: "Magelang", address: "Kampus 2 UMM, Jalan Mayjend Bambang Soegeng Km. 5, Mertoyudan, Magelang", email: "himanifoummgl@gmail.com", logo: "/assets/himpunan/25.webp" },
  { no: 26, name: "GENETIKA", institution: "Politeknik Sawunggalih Aji", city: "Purworejo", address: "Jalan Wismo Aji No. 8, Kutoarjo, Purworejo, Jawa Tengah 54251", email: null, logo: "/assets/himpunan/26.webp" },
  { no: 27, name: "HMTI UMUS BREBES", institution: "Universitas Muhadi Setiabudi Brebes", city: "Brebes", address: "Jalan Pangeran Diponegoro Km. 2, Pesantunan, Wanasari, Brebes, Jawa Tengah 52221", email: "umus.hmti@gmail.com", logo: "/assets/himpunan/27.webp" },
  { no: 28, name: "HMTI UNISS", institution: "Universitas Slamet Sri", city: "Batang", address: "Jalan Raya Candi, Gondangsari, Clapar, Subah, Batang, Jawa Tengah 51262", email: null, logo: null },
  { no: 29, name: "HMTK PHB Tegal", institution: "Politeknik Harapan Bersama Tegal", city: "Tegal", address: "Jalan Mataram No. 9 (Belakang Terminal), Pesurungan Lor, Kota Tegal", email: "himaprodikomputer@gmail.com", logo: "/assets/himpunan/29.webp" },
  { no: 30, name: "HMTI PHB Tegal", institution: "Politeknik Harapan Bersama Tegal", city: "Tegal", address: "Jalan Dewi Sartika No. 71, Pesurungan Kidul, Kec. Tegal Barat, Kota Tegal", email: "hmpinformatika@gmail.com", logo: "/assets/himpunan/30.webp" },
  { no: 31, name: "HIMATRIS PNC", institution: "Politeknik Negeri Cilacap", city: "Cilacap", address: "Jalan Dokter Soetomo No. 1, Karangcengis, Sidakaya, Cilacap Selatan, Cilacap, Jawa Tengah 53212", email: "himatris@pnc.ac.id", logo: "/assets/himpunan/31.webp" },
  { no: 32, name: "HMTI SCU", institution: "Universitas Katolik Soegijapranata Semarang", city: "Semarang", address: "Jalan Pawiyatan Luhur IV/1, Bendan Duwur, Gajahmungkur, Semarang, Jawa Tengah 50234", email: "hmti@unika.ac.id", logo: "/assets/himpunan/32.webp" },
  { no: 33, name: "HIMATIF Universitas Sahid Surakarta", institution: "Universitas Sahid Surakarta", city: "Surakarta", address: "Jalan Adi Sucipto No. 54, Jajar, Surakarta", email: "himatifuss@gmail.com", logo: "/assets/himpunan/33.webp" },
  { no: 34, name: "HMPTI Universitas Duta Bangsa Surakarta", institution: "Universitas Duta Bangsa Surakarta", city: "Surakarta", address: "Jalan Bhayangkara No. 55-57, Surakarta", email: "hmpti@fikom.udb.ac.id", logo: "/assets/himpunan/34.webp" },
  { no: 35, name: "HIMTI BIPA", institution: "STMIK Bina Patria Magelang", city: "Magelang", address: "Jalan Raden Saleh No. 2, Potrobangsan, Magelang Utara, Kota Magelang, Jawa Tengah", email: "himtibipaa@gmail.com", logo: "/assets/himpunan/35.webp" },
  { no: 36, name: "HIMAFORTIC UNUGHA", institution: "Universitas Nahdlatul Ulama Al Ghazali Cilacap", city: "Cilacap", address: "Jalan Kemerdekaan Barat No. 17, Gligir, Kesugihan Kidul, Kesugihan, Cilacap, Jawa Tengah", email: "himafortic@unugha.id", logo: "/assets/himpunan/36.webp" },
  { no: 37, name: "HIMATIF UMNU Kebumen", institution: "Universitas Ma'arif Nahdlatul Ulama Kebumen", city: "Kebumen", address: "Kampus Pusat UMNU Kebumen, Jl. Kusuma No. 75, Wonoyoso, Bumirejo, Kebumen, Jawa Tengah", email: "himatifumnukebumen@gmail.com", logo: "/assets/himpunan/37.webp" },
  { no: 38, name: "HMSE IT Telkom", institution: "Telkom University Purwokerto", city: "Purwokerto", address: "Jalan D.I. Panjaitan No. 128, Purwokerto, Jawa Tengah", email: "hmse@ittelkom-pwt.ac.id", logo: "/assets/himpunan/38.webp" },
  { no: 39, name: "HMP", institution: "Universitas Boyolali", city: "Boyolali", address: "Jalan Pandanaran 405, Boyolali, Jawa Tengah", email: "himatek@gmail.com", logo: "/assets/himpunan/39.webp" },
  { no: 40, name: "HMPI", institution: "Universitas Peradaban", city: "Brebes", address: "Jalan Raya Pagojengan Km. 03, Paguyangan, Brebes, Jawa Tengah 52276", email: null, logo: "/assets/himpunan/40.webp" },
  { no: 41, name: "HMJ-I", institution: "STT Ronggolawe", city: "Blora", address: "Jalan Kampus Ronggolawe No. 1, Blok B Mentul, Cepu, Blora, Jawa Tengah", email: "informatikasttr@gmail.com", logo: "/assets/himpunan/41.webp" },
  { no: 42, name: "HMPS Informatika", institution: "UIN Saizu Purwokerto", city: "Purwokerto", address: "Jl. A. Yani No. 40A, Karanganjing, Purwanegara, Kec. Purwokerto Utara, Kabupaten Banyumas, Jawa Tengah 53126", email: "hmpsinformatikauinsaizu@gmail.com", logo: "/assets/himpunan/42.webp" },
  { no: 43, name: "HIMATIKA", institution: "ITSNU Pekalongan", city: "Pekalongan", address: "Jl. Karangdowo No. 9, Kemoren, Karangdowo, Kec. Kedungwuni, Kabupaten Pekalongan, Jawa Tengah 51173", email: "himatikaitsnupkl@gmail.com", logo: "/assets/himpunan/43.webp" },
  { no: 44, name: "HIMTIF", institution: "Universitas Slamet Sri", city: "Kendal", address: "Jl. Raya Soekarno-Hatta Km. 03, Gondoarum, Jambearum, Kec. Patebon, Kabupaten Kendal, Jawa Tengah", email: "hmjti001@gmail.com", logo: "/assets/himpunan/44.webp" },
  { no: 45, name: "HMPS Informatika", institution: "Universitas Amikom Purwokerto", city: "Purwokerto", address: "Jl. Letjend. Pol. Soemarto, Watumas, Purwokerto", email: "hmps_if@amikompurwokerto.ac.id", logo: "/assets/himpunan/45.webp" },
]

// Label pendek untuk nama himpunan yang generik/terlalu panjang di PDF,
// supaya marquee tidak menampilkan dua "HMPS Informatika" tanpa konteks.
const shortLabel: Record<number, string> = {
  3: "HMDTI UDINUS",
  4: "HMJTI UNWAHAS",
  22: "HMIF TELKOM PWT",
  26: "GENETIKA POLSA",
  33: "HIMATIF USS",
  34: "HMPTI UDB",
  39: "HMP UBY",
  40: "HMPI PERADABAN",
  41: "HMJ-I STT RONGGOLAWE",
  42: "HMPS IF UIN SAIZU",
  43: "HIMATIKA ITSNU",
  44: "HIMTIF UNISS",
  45: "HMPS IF AMIKOM PWT",
}

export type MemberIndexItem = { label: string; logo: string | null }
export type MemberGroup = { city: string; members: Himpunan[] }

/** Indeks singkat untuk marquee hero: label + logo. */
export function buildMemberIndex(list: Himpunan[]): MemberIndexItem[] {
  return list.map((h) => ({
    label:
      h.shortLabel !== undefined
        ? h.shortLabel || h.name
        : (shortLabel[h.no] ?? h.name),
    logo: h.logo,
  }))
}

/** Himpunan dikelompokkan per kota, kota terbanyak dulu. */
export function groupByCity(list: Himpunan[]): MemberGroup[] {
  return Object.entries(
    list.reduce<Record<string, Himpunan[]>>((acc, h) => {
      ;(acc[h.city || "Lainnya"] ??= []).push(h)
      return acc
    }, {})
  )
    .map(([city, members]) => ({ city, members }))
    .sort((a, b) => b.members.length - a.members.length || a.city.localeCompare(b.city))
}

export type RegionGroup = { region: number; label: string; members: Himpunan[] }

/** Himpunan per daerah (1-6 urut, lalu "Belum ditentukan" = 0); anggota urut kota lalu nama. */
export function groupByRegion(list: Himpunan[]): RegionGroup[] {
  const byRegion = new Map<number, Himpunan[]>()
  for (const h of list) {
    const r = h.region && h.region >= 1 && h.region <= 6 ? h.region : 0
    byRegion.set(r, [...(byRegion.get(r) ?? []), h])
  }
  return [...byRegion.entries()]
    .sort(([a], [b]) => (a || 99) - (b || 99))
    .map(([region, members]) => ({
      region,
      label: region ? `Daerah ${region}` : "Belum ditentukan",
      members: [...members].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name)),
    }))
}

export const memberIndex = buildMemberIndex(himpunanList)
export const memberDirectory: MemberGroup[] = groupByCity(himpunanList)

// Sumber: Data Diri FORMATUR BPW 26/27 (+ akun pengguna hasil impor) — jalur
// PH, tiap divisi (Kadiv → Sekdiv → Anggota), lalu Koordinator Daerah.
export const officialGroups = [
  {
    division: "Pengurus Harian",
    members: [
      { name: "Ghani Al-Fatah", role: "Koordinator Wilayah", origin: "HIMTI UNSIQ" },
      { name: "Mukhammad Khisanul Labib", role: "Wakil Koordinator Wilayah", origin: "HIMATIKA ITSNU Pekalongan" },
      { name: "Arbasya Anandito", role: "Sekretaris Wilayah 1", origin: "HIMATRIS PNC" },
      { name: "Dapa", role: "Sekretaris Wilayah 2", origin: "HMPTI Telkom University Purwokerto" },
      { name: "Ica Danisa", role: "Bendahara Wilayah 1", origin: "HIMTI UNSIQ" },
      { name: "Jamilun Nadif", role: "Bendahara Wilayah 2", origin: "HIMATEKNO UMPWR" },
    ],
  },
  {
    division: "PSDM",
    members: [
      { name: "Seikha Najla", role: "Kepala Divisi", origin: "HIMATEKNO UMPWR" },
      { name: "Rahmad Aris Setiawan", role: "Sekretaris Divisi", origin: "HMJ-I STT Ronggolawe" },
      { name: "Faizal Abdila", role: "Anggota Divisi", origin: "HIMATIF UMNU" },
      { name: "Solahudin Al-Ayubi", role: "Anggota Divisi", origin: "HMPSIF UNISNU" },
      { name: "Apri Milandari Awiyama", role: "Anggota Divisi", origin: "HIMA TEKOM UHN" },
      { name: "Indra Hermawan", role: "Anggota Divisi", origin: "HMIF UPS" },
      { name: "M. Mundzir Adil Ardana", role: "Anggota Divisi", origin: "HIMATIF UMNU" },
      { name: "Marta Safitri", role: "Anggota Divisi", origin: "HMSE Telkom University Purwokerto" },
      { name: "Bima Andiansyah", role: "Anggota Divisi", origin: "UIN Walisongo Semarang" },
      { name: "Fitriadita Hilal Majid", role: "Anggota Divisi", origin: "HIMFORMA UPGRIS" },
      { name: "M. Rikza Alifika", role: "Anggota Divisi", origin: "UIN Walisongo Semarang" },
    ],
  },
  {
    division: "Medkominfo",
    members: [
      { name: "M. Qistil Mizan", role: "Kepala Divisi", origin: "HIMATIKA ITSNU Pekalongan" },
      { name: "Anindya Yuna Chamda", role: "Sekretaris Divisi", origin: "HIMATIKA ITSNU Pekalongan" },
      { name: "Abdhe Rachmanzah", role: "Anggota Divisi", origin: "HMTIKA STIMIK Tunas Bangsa Banjarnegara" },
      { name: "Muchamad Danang Prastyo", role: "Anggota Divisi", origin: "HIMANIFO UNIMMA" },
      { name: "Dhafin Rifki Bayu Santoso", role: "Anggota Divisi", origin: "HMP MIKROPTIK UNS" },
      { name: "Muhammad Fakih", role: "Anggota Divisi", origin: "HIMATIF UMPKU" },
      { name: "Didi Purnomo", role: "Anggota Divisi", origin: "HMPS Informatika UIN Gusdur" },
    ],
  },
  {
    division: "IPTEK",
    members: [
      { name: "Bayu Prasetyo", role: "Kepala Divisi", origin: "HIMATIV UHN" },
      { name: "Muhammad Alvin Hidayat", role: "Sekretaris Divisi", origin: "GENETIKA POLSA" },
      { name: "Roya Firman Gani", role: "Anggota Divisi", origin: "GENETIKA POLSA" },
      { name: "Nanda Bagus Priambodo", role: "Anggota Divisi", origin: "HMPTI Telkom University Purwokerto" },
      { name: "Afif Abdurrohman Assidiq", role: "Anggota Divisi", origin: "HIMAFOR UNIMUS" },
      { name: "Lilis Nuraeni", role: "Anggota Divisi", origin: "HIMA TI UNW" },
      { name: "Farel Adi Nugraha Prastya", role: "Anggota Divisi", origin: "HM-TIF UNISSULA" },
      { name: "Radita Putri Nuraini", role: "Anggota Divisi", origin: "HMSE Telkom University Purwokerto" },
    ],
  },
  {
    division: "KWU",
    members: [
      { name: "Alhambra Fernando", role: "Kepala Divisi", origin: "HIMATEKNO UMPWR" },
      { name: "Quratu Ayun Defaren", role: "Sekretaris Divisi", origin: "HMSE Telkom University Purwokerto" },
      { name: "Aprilia Sahara", role: "Anggota Divisi", origin: "HIMATIKA ITSNU Pekalongan" },
      { name: "Damanik, Yohanes Geovan Ondova", role: "Anggota Divisi", origin: "HMPTI Telkom University Purwokerto" },
      { name: "Rachmat Hermansyah", role: "Anggota Divisi", origin: "HIMAFORTIC UNUGHA" },
      { name: "Muchamad Fatchur Rachman", role: "Anggota Divisi", origin: "HIMATIF UMPKU" },
      { name: "Herlina Zahra Nurhalisa", role: "Anggota Divisi", origin: "HMJTI Unwahas" },
      { name: "Luriyanti Novika Purnama Sari", role: "Anggota Divisi", origin: "HIMFORMA UPGRIS" },
      { name: "Refian Nazar Malik", role: "Anggota Divisi", origin: "HMTIKA STIMIK Tunas Bangsa Banjarnegara" },
    ],
  },
  {
    division: "PR",
    members: [
      { name: "Afifatul Khusna", role: "Kepala Divisi", origin: "HM-TIF UNISSULA" },
      { name: "Khadijah Nur Fatonah", role: "Sekretaris Divisi", origin: "HIMA TI UNW" },
      { name: "M. Risqi Agung Pratama", role: "Anggota Divisi", origin: "HMPS Informatika UIN Gusdur" },
      { name: "Bisma Wahyu Eka Pratama", role: "Anggota Divisi", origin: "HMJ-I STT Ronggolawe" },
      { name: "Ahmad Dani Ajibal", role: "Anggota Divisi", origin: "HIMTI UNSIQ" },
      { name: "Haydar Azka", role: "Anggota Divisi", origin: "HIMATIF UMNU" },
      { name: "Durrotul Hidayatul Muna", role: "Anggota Divisi", origin: "HMJTI Unwahas" },
      { name: "Nuril Anwar", role: "Anggota Divisi", origin: "HIMAFOR UNIMUS" },
      { name: "Sintia Nur Mala Dewi", role: "Anggota Divisi", origin: "HMPSIF UNISNU" },
      { name: "M. Dzaky Harpy Pratama", role: "Anggota Divisi", origin: "UIN Walisongo Semarang" },
    ],
  },
  {
    division: "Koordinator Daerah",
    members: [
      { name: "Achmad Fikr Mujahid", role: "Koordinator Daerah 1", origin: "HIMATIV UHN" },
      { name: "Cikal Chrestella Cora", role: "Koordinator Daerah 2", origin: "HMSE Telkom University Purwokerto" },
      { name: "Nabilla Ananta", role: "Koordinator Daerah 3", origin: "HIMFORMA UPGRIS" },
      { name: "Riska Damayanti", role: "Koordinator Daerah 4", origin: "HMTIKA STIMIK Tunas Bangsa Banjarnegara" },
      { name: "Arsya Fitrotul Firdaus", role: "Koordinator Daerah 5", origin: "HIMA Pro TI Universitas Muria Kudus" },
      { name: "Galang Nur Seto", role: "Koordinator Daerah 6", origin: "HMP MIKROPTIK UNS" },
    ],
  },
] as const

/** Koordinator Daerah N dari `officialGroups`; undefined bila tidak ada. */
export function getRegionCoordinator(region: number): { name: string; origin: string } | undefined {
  const group = officialGroups.find((g) => g.division === "Koordinator Daerah")
  const m = group?.members.find((x) => x.role === `Koordinator Daerah ${region}`)
  return m ? { name: m.name, origin: m.origin } : undefined
}

export const recruitmentCta = {
  title: "Himpunanmu belum tergabung?",
  body: "Pendaftaran anggota dilayani melalui Sekretaris Wilayah. Sampaikan maksud himpunanmu, dan tim keanggotaan akan menuntun proses penggabungan dari awal sampai sah.",
  primary: { label: "Hubungi Sekretaris Wilayah", href: `mailto:${org.email}` },
  secondary: { label: "Masuk ke portal pengurus", href: "/login" },
} as const

/**
 * Langkah alur undangan: dipakai di section landing dan halaman /undangan
 * supaya keduanya selalu menceritakan proses yang sama.
 */
export const invitationSteps = [
  {
    title: "Isi formulir",
    body: "Nama himpunan atau instansi, nama acara, dan tanggal berlangsung. Tanpa akun, tanpa login.",
  },
  {
    title: "Lampirkan surat",
    body: "Unggah surat undangan resmi dalam format PDF, maksimal 5 MB.",
  },
  {
    title: "Kami tindak lanjuti",
    body: "Undangan masuk ke kotak sekretariat, lalu pengurus menugaskan delegasi yang berangkat.",
  },
] as const

/**
 * Koordinat perkiraan (bujur, lintang) kota-kota Jawa Tengah. Dipakai kanvas
 * jaringan di hero dan peta himpunan — bentuk provinsi muncul dari sebaran
 * titiknya sendiri, tanpa poligon peta.
 */
export const cityNodes = [
  { name: "Brebes", lon: 109.03, lat: -6.87 },
  { name: "Tegal", lon: 109.14, lat: -6.87 },
  { name: "Pemalang", lon: 109.38, lat: -6.89 },
  { name: "Pekalongan", lon: 109.67, lat: -6.89 },
  { name: "Batang", lon: 109.73, lat: -6.91 },
  { name: "Kendal", lon: 110.2, lat: -6.92 },
  { name: "Semarang", lon: 110.42, lat: -6.99 },
  { name: "Demak", lon: 110.64, lat: -6.89 },
  { name: "Jepara", lon: 110.67, lat: -6.59 },
  { name: "Kudus", lon: 110.84, lat: -6.8 },
  { name: "Pati", lon: 111.04, lat: -6.75 },
  { name: "Rembang", lon: 111.34, lat: -6.71 },
  { name: "Blora", lon: 111.42, lat: -6.97 },
  { name: "Grobogan", lon: 110.92, lat: -7.09 },
  { name: "Ungaran", lon: 110.4, lat: -7.14 },
  { name: "Salatiga", lon: 110.5, lat: -7.33 },
  { name: "Temanggung", lon: 110.17, lat: -7.32 },
  { name: "Wonosobo", lon: 109.9, lat: -7.36 },
  { name: "Banjarnegara", lon: 109.69, lat: -7.39 },
  { name: "Purbalingga", lon: 109.36, lat: -7.39 },
  { name: "Purwokerto", lon: 109.24, lat: -7.42 },
  { name: "Cilacap", lon: 109.01, lat: -7.73 },
  { name: "Kebumen", lon: 109.65, lat: -7.67 },
  { name: "Purworejo", lon: 110.01, lat: -7.71 },
  { name: "Magelang", lon: 110.22, lat: -7.48 },
  { name: "Boyolali", lon: 110.6, lat: -7.53 },
  { name: "Klaten", lon: 110.6, lat: -7.7 },
  { name: "Surakarta", lon: 110.82, lat: -7.57 },
  { name: "Sragen", lon: 111.02, lat: -7.43 },
  { name: "Sukoharjo", lon: 110.84, lat: -7.68 },
  { name: "Karanganyar", lon: 110.95, lat: -7.6 },
  { name: "Wonogiri", lon: 110.92, lat: -7.81 },
] as const

/** Angka ringkas, dihitung dari data di atas — tidak ada angka karangan. */
export function buildStats(directory: MemberGroup[]) {
  const officials: { origin: string }[] = officialGroups.flatMap((g) => [...g.members])
  const origins = new Set(officials.map((o) => o.origin))
  const memberHimpunan = directory.reduce((n, g) => n + g.members.length, 0)
  return [
    { value: officials.length, label: "Pengurus wilayah", note: "periode 2026/2027" },
    { value: origins.size, label: "Himpunan terwakili", note: "di Badan Pengurus Wilayah" },
    { value: officialGroups.length - 1, label: "Divisi kerja", note: "plus koordinator daerah" },
    { value: memberHimpunan, label: "Himpunan anggota", note: `di ${directory.length} kota` },
  ]
}
