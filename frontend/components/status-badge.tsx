import { Badge } from "@/components/ui/badge"

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  upcoming: "secondary",
  ongoing: "default",
  finished: "outline",
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  present: "default",
  permitted: "secondary",
  absent: "destructive",
}

// Label Indonesia untuk status yang tampil di badge. Nilai dari API tetap enum
// (`present`, `approved`, …) supaya logika tidak bergantung pada teks.
const statusLabel: Record<string, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  deleted: "Dihapus",
  upcoming: "Mendatang",
  ongoing: "Berlangsung",
  finished: "Selesai",
  cancelled: "Dibatalkan",
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
  present: "Hadir",
  permitted: "Izin disetujui",
  absent: "Tidak hadir",
  draft: "Draf",
  open: "Dibuka",
  closed: "Ditutup",
  submitted: "Terkirim",
  interview: "Wawancara",
  accepted: "Diterima",
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <Badge variant="outline">-</Badge>
  const key = status.toLowerCase()
  return (
    <Badge variant={statusVariant[key] ?? "outline"} className="capitalize">
      {statusLabel[key] ?? status.replace(/_/g, " ")}
    </Badge>
  )
}
