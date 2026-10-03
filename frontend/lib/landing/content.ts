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

export const navLinks = [
  { label: "Tentang", href: "/#tentang" },
  { label: "Program", href: "/#program" },
  { label: "Himpunan", href: "/#himpunan" },
  { label: "Pengurus", href: "/#pengurus" },
  { label: "Kontak", href: "/#kontak" },
] as const

export const hero = {
  eyebrow: "Perhimpunan Mahasiswa Informatika dan Komputer Nasional",
  title: "Maju Bersama Teknologi",
  subtitle:
    "Wilayah VII PERMIKOMNAS mewadahi himpunan mahasiswa informatika dan komputer lintas kampus di Jawa Tengah. Berjejaring, berkiprah, dan bertumbuh bersama dalam satu perhimpunan.",
  primaryCta: { label: "Lihat program kerja", href: "/#program" },
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

export const programs = [
  {
    name: "Kongres Wilayah",
    description:
      "Musyawarah tertinggi antar-himpunan: evaluasi periode, arah gerakan, dan pemilihan Badan Pengurus Wilayah.",
    cadence: "Tahunan",
  },
  {
    name: "Seminar dan Kajian Teknologi",
    description:
      "Pembicara dari industri dan akademisi membahas tren teknologi terkini untuk mahasiswa seluruh Jawa Tengah.",
    cadence: "Semesteran",
  },
  {
    name: "Kompetisi Antar-Kampus",
    description:
      "Panggung lomba pemrograman, keamanan, dan inovasi digital yang mempertemukan talenta dari tiap himpunan anggota.",
    cadence: "Tahunan",
  },
  {
    name: "Pelatihan dan Sertifikasi",
    description:
      "Kelas intensif dan program sertifikasi bersama mitra untuk memperkuat kesiapan kerja anggota.",
    cadence: "Berkelanjutan",
  },
  {
    name: "Kolaborasi Riset",
    description:
      "Wadah kolaborasi riset dan pengabdian antar-himpunan lintas kampus dalam satu wilayah.",
    cadence: "Per periode",
  },
] as const

export const memberIndex = [
  "UNDIP",
  "UNNES",
  "UDINUS",
  "POLINES",
  "UNS",
  "UMS",
  "UKSW",
  "UNSOED",
  "UIN KUDUS",
] as const

export const memberDirectory: { city: string; members: string[] }[] = [
  {
    city: "Semarang",
    members: [
      "Himpunan Mahasiswa Informatika Universitas Diponegoro",
      "Himpunan Mahasiswa Ilmu Komputer Universitas Negeri Semarang",
      "Himpunan Mahasiswa Informatika Universitas Dian Nuswantoro",
      "Himpunan Mahasiswa Teknik Informatika Polines",
    ],
  },
  {
    city: "Surakarta",
    members: [
      "Himpunan Mahasiswa Informatika Universitas Sebelas Maret",
      "Himpunan Mahasiswa Informatika Universitas Muhammadiyah Surakarta",
      "Himpunan Mahasiswa Informatika UIN Raden Mas Said",
    ],
  },
  {
    city: "Purwokerto",
    members: [
      "Himpunan Mahasiswa Teknik Informatika Universitas Jenderal Soedirman",
      "Himpunan Mahasiswa Teknik Informatika Universitas Muhammadiyah Purwokerto",
    ],
  },
  { city: "Salatiga", members: ["Himpunan Mahasiswa Informatika UKSW"] },
  { city: "Magelang", members: ["Himpunan Mahasiswa Informatika Unikma"] },
  { city: "Kudus", members: ["Himpunan Mahasiswa Informatika UIN Kudus"] },
]

export const officials = [
  {
    name: "Raka Adi Pramudya",
    role: "Ketua Badan Pengurus Wilayah",
    origin: "Universitas Diponegoro",
  },
  {
    name: "Nadya Ayu Ramadhani",
    role: "Sekretaris Wilayah",
    origin: "Universitas Sebelas Maret",
  },
  {
    name: "Salsabila Putri Handayani",
    role: "Bendahara Wilayah",
    origin: "Universitas Muhammadiyah Surakarta",
  },
  {
    name: "Dimas Prasetyo Nugroho",
    role: "Koordinator Bidang Organisasi dan Keanggotaan",
    origin: "Universitas Dian Nuswantoro",
  },
  {
    name: "Alya Rahmawati",
    role: "Koordinator Bidang Akademik dan Riset",
    origin: "Universitas Jenderal Soedirman",
  },
  {
    name: "Bayu Setiawan",
    role: "Koordinator Bidang Komunikasi dan Informasi",
    origin: "Politeknik Negeri Semarang",
  },
  {
    name: "Kirana Maheswari",
    role: "Koordinator Bidang Humas dan Kemitraan",
    origin: "Universitas Kristen Satya Wacana",
  },
]

export const recruitmentCta = {
  title: "Himpunanmu belum tergabung?",
  body: "Pendaftaran anggota dilayani melalui Sekretaris Wilayah. Sampaikan maksud himpunanmu, dan tim keanggotaan akan menuntun proses penggabungan dari awal sampai sah.",
  primary: { label: "Hubungi Sekretaris Wilayah", href: `mailto:${org.email}` },
  secondary: { label: "Masuk ke portal anggota", href: "/login" },
} as const
