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

export const recruitmentCta = {
  title: "Himpunanmu belum tergabung?",
  body: "Pendaftaran anggota dilayani melalui Sekretaris Wilayah. Sampaikan maksud himpunanmu, dan tim keanggotaan akan menuntun proses penggabungan dari awal sampai sah.",
  primary: { label: "Hubungi Sekretaris Wilayah", href: `mailto:${org.email}` },
  secondary: { label: "Masuk ke portal anggota", href: "/login" },
} as const
