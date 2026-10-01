import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FEATURES } from "@/lib/features"

/**
 * Absensi mandiri (selfie + tanda tangan) dimatikan sementara lewat
 * `lib/features.ts`. Halaman aslinya tidak diubah dan data absensi lama tetap
 * utuh — setel flag ke true untuk mengaktifkannya kembali. Untuk sekarang
 * ketidakhadiran dicatat lewat alur **perizinan**.
 */
export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (FEATURES.attendance) return <>{children}</>

  return (
    <>
      <PageHeader
        title="Absensi"
        crumbs={[
          { label: "Event", href: "/events" },
          { label: "Absensi" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Absensi mandiri dinonaktifkan</CardTitle>
            <CardDescription>
              Absensi dengan selfie dan tanda tangan belum dipakai. Untuk
              sekarang, ketidakhadiran dicatat lewat pengajuan izin pada halaman
              event. Data absensi yang sudah ada tidak dihapus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/events" />}>
              Lihat daftar event
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
