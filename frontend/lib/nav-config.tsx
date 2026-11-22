import {
  CalendarIcon,
  ClipboardListIcon,
  GlobeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MailIcon,
  MegaphoneIcon,
  SettingsIcon,
  ShieldAlertIcon,
  ShieldIcon,
  UsersIcon,
} from "lucide-react"
import { FEATURES } from "@/lib/features"
import type { NavGroup, NavItem, NavSubItem } from "@/lib/types"

/**
 * Satu navigasi untuk seluruh Portal Pengurus. Semua item difilter RBAC lewat
 * `filterNav` — pengurus biasa hanya melihat item personal, admin melihat
 * item pengelolaan sesuai permission-nya. Profil sengaja tidak ada di sini:
 * aksesnya lewat menu pengguna di kiri bawah (nav-user.tsx).
 *
 * Url induk (item dengan `items`) = url sub-item pertama; dipakai saat induk
 * diratakan menjadi tautan langsung.
 */
export const portalNav: NavGroup[] = [
  {
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: <LayoutDashboardIcon className="size-4" />,
      },
    ],
  },
  {
    label: "Kegiatan",
    items: [
      {
        title: "Event",
        url: "/events",
        icon: <CalendarIcon className="size-4" />,
        items: [
          { title: "Jadwal & Absensi", url: "/events", permission: "events.view" },
          {
            title: "Kelola Event",
            url: "/admin/events",
            permission: "events.create",
          },
        ],
      },
      // Cukup login: anggota perlu melihat undangan untuk menugaskan dirinya
      // sendiri; assign orang lain tetap digerbangi invitations.manage.
      {
        title: "Undangan Masuk",
        url: "/invitations",
        icon: <InboxIcon className="size-4" />,
      },
      // Rekrutmen belum ada: /admin/recruitments hanya redirect (modul dihapus).
    ],
  },
  {
    label: "Kehadiran & Disiplin",
    items: [
      {
        title: "Perizinan",
        url: "/my-permissions",
        icon: <ClipboardListIcon className="size-4" />,
        items: [
          {
            title: "Perizinan Saya",
            url: "/my-permissions",
            permission: "permission.submit",
          },
          {
            title: "Approval Izin",
            url: "/admin/permissions",
            // Kadiv/Sekdiv memegang approve_own: menyetujui izin event yang mereka buat/kelola.
            permission: ["attendance.approve", "attendance.approve_own"],
          },
          {
            title: "Kategori Izin",
            url: "/admin/permissions/categories",
            permission: "permission.categories.manage",
          },
        ],
      },
      {
        title: "Pelanggaran",
        url: "/my-violations",
        icon: <ShieldAlertIcon className="size-4" />,
        items: [
          { title: "Pelanggaran Saya", url: "/my-violations" },
          {
            title: "Pelanggaran & SP",
            url: "/admin/violations",
            permission: "violations.view",
          },
        ],
      },
    ],
  },
  {
    label: "Komunikasi",
    items: [
      {
        title: "Pengumuman",
        url: "/announcements",
        icon: <MegaphoneIcon className="size-4" />,
        items: [
          { title: "Lihat Pengumuman", url: "/announcements" },
          {
            title: "Kelola Pengumuman",
            url: "/admin/announcements",
            permission: "announcement.create",
          },
        ],
      },
      {
        title: "Surat",
        url: "/admin/letters/incoming",
        icon: <MailIcon className="size-4" />,
        items: [
          {
            title: "Surat Masuk",
            url: "/admin/letters/incoming",
            permission: "letters.view",
          },
          {
            title: "Surat Keluar",
            url: "/admin/letters/outgoing",
            permission: "letters.view",
          },
          {
            title: "Kategori Surat",
            url: "/admin/letters/categories",
            permission: "letters.manage",
          },
          {
            title: "Template Surat",
            url: "/admin/letters/templates",
            permission: "letters.manage",
          },
        ],
      },
    ],
  },
  {
    label: "Organisasi",
    items: [
      {
        title: "Direktori Pengurus",
        url: "/members",
        icon: <UsersIcon className="size-4" />,
      },
      {
        title: "Akun & Akses",
        url: "/admin/users",
        icon: <ShieldIcon className="size-4" />,
        items: [
          { title: "Pengguna", url: "/admin/users", permission: "users.view" },
          { title: "Role & Akses", url: "/admin/roles", permission: "roles.view" },
          {
            title: "Divisi",
            url: "/admin/divisions",
            permission: "divisions.view",
          },
        ],
      },
    ],
  },
  {
    label: "Kelola",
    items: [
      {
        title: "Website Publik",
        url: "/admin/press-releases",
        icon: <GlobeIcon className="size-4" />,
        items: [
          {
            title: "Berita",
            url: "/admin/press-releases",
            permission: "press_release.manage",
          },
          { title: "Merch", url: "/admin/merch", permission: "merch.manage" },
          {
            title: "Himpunan",
            url: "/admin/himpunan",
            permission: "himpunan.manage",
          },
          {
            title: "Program Kerja",
            url: "/admin/work-programs",
            permission: "work_program.manage",
          },
          {
            title: "Tampilan Landing",
            url: "/admin/landing",
            permission: "landing.manage",
          },
        ],
      },
      {
        title: "Sistem",
        url: "/admin/settings",
        icon: <SettingsIcon className="size-4" />,
        items: [
          {
            title: "Pengaturan",
            url: "/admin/settings",
            permission: "settings.manage",
          },
          {
            title: "Penyimpanan Cloud",
            url: "/admin/storage",
            permission: "storage.view",
          },
          {
            title: "Backup",
            url: "/admin/backup",
            permission: "backup.manage",
          },
          {
            title: "Log Aktivitas",
            url: "/admin/activity",
            permission: "view.activity",
          },
          // Keuangan sedang dimatikan (lib/features.ts) — itemnya ikut hilang
          // dari sidebar, tapi halaman, tabel, dan datanya tetap utuh.
          ...(FEATURES.finance
            ? [
                {
                  title: "Keuangan",
                  url: "/admin/finance",
                  permission: "finance.view",
                },
              ]
            : []),
        ],
      },
    ],
  },
]

/**
 * Terapkan RBAC ke navigasi:
 *  a) item/sub-item dengan `permission` disembunyikan jika user tidak punya;
 *  b) induk yang semua sub-itemnya tersembunyi ikut disembunyikan;
 *  c) induk dengan tepat SATU sub-item terlihat diratakan menjadi tautan
 *     langsung ke url sub-item itu (judul + ikon induk dipertahankan);
 *  d) grup tanpa item terlihat disembunyikan.
 */
export function filterNav(
  groups: NavGroup[],
  hasPermission: (required?: string | string[]) => boolean
): NavGroup[] {
  const result: NavGroup[] = []
  for (const group of groups) {
    const items: NavItem[] = []
    for (const item of group.items) {
      if (!hasPermission(item.permission)) continue
      if (!item.items) {
        items.push(item)
        continue
      }
      const subs = item.items.filter((sub) => hasPermission(sub.permission))
      if (subs.length === 0) continue
      if (subs.length === 1) {
        // Judul sub-menu dipakai (bukan judul induk): "Akun & Akses" yang
        // isinya hanya Divisi tampil sebagai "Divisi", tidak menyesatkan.
        items.push({ title: subs[0].title, icon: item.icon, url: subs[0].url })
        continue
      }
      items.push({ ...item, items: subs })
    }
    if (items.length > 0) result.push({ ...group, items })
  }
  return result
}

/**
 * Url nav yang aktif untuk `pathname`: longest-prefix match di seluruh url
 * (induk maupun sub-item), mis. /admin/events/12/edit -> "/admin/events".
 */
export function findActiveUrl(
  groups: NavGroup[],
  pathname: string
): string | null {
  let best: string | null = null
  const consider = (url: string) => {
    if (pathname !== url && !pathname.startsWith(`${url}/`)) return
    if (best === null || url.length > best.length) best = url
  }
  for (const group of groups) {
    for (const item of group.items) {
      consider(item.url)
      item.items?.forEach((sub: NavSubItem) => consider(sub.url))
    }
  }
  return best
}
