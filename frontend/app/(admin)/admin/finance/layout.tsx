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
 * Modul keuangan dimatikan sementara lewat `lib/features.ts`. Halaman aslinya
 * tidak diubah dan datanya tidak disentuh — cukup setel flag ke true untuk
 * mengaktifkannya kembali.
 */
export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (FEATURES.finance) return <>{children}</>

  return (
    <>
      <PageHeader
        title="Keuangan"
        crumbs={[
          { label: "Admin", href: "/admin/dashboard" },
          { label: "Keuangan" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Modul keuangan dinonaktifkan</CardTitle>
            <CardDescription>
              Fitur keuangan (kategori, transaksi, dan wallet) dimatikan
              sementara supaya fokus ke event, kalender, dan perizinan. Data
              yang sudah ada tidak dihapus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/admin/dashboard" />}>
              Kembali ke dasbor
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
