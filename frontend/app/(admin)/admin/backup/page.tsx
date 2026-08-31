"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getApiBase } from "@/lib/api"
import { getStoredToken, setStoredToken } from "@/lib/auth"

type RestoreResult = {
  files_restored: number
  files_failed?: number
  database: Record<string, number>
}

export default function AdminBackupPage() {
  const router = useRouter()
  const [restoring, setRestoring] = useState(false)
  const [result, setResult] = useState<RestoreResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleRestore(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) return
    const confirmed = window.confirm(
      "Restore akan MENGGANTI seluruh data database dengan isi backup. Data lokal yang tidak ada di ZIP akan dihapus. Setelah selesai Anda harus login ulang. Lanjutkan?"
    )
    if (!confirmed) return
    setRestoring(true)
    setResult(null)
    try {
      const form = new FormData()
      form.append("file", file)
      const token = getStoredToken()
      const res = await fetch(`${getApiBase()}/backup`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal restore")
      }
      setResult(json.data as RestoreResult)
      setStoredToken(null)
      toast.success("Backup berhasil dipulihkan. Silakan login ulang.")
      router.replace("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal restore")
    } finally {
      setRestoring(false)
    }
  }

  const restoredTables = result
    ? Object.entries(result.database).filter(([, n]) => n > 0)
    : []

  return (
    <>
      <PageHeader
        title="Backup & Restore"
        crumbs={[
          { label: "Admin", href: "/admin/settings" },
          { label: "Backup" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Export Backup</CardTitle>
            <CardDescription>
              Unduh arsip ZIP berisi seluruh data database (data.json) dan
              semua file di storage lokal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<a href={`${getApiBase()}/backup`} download />}>
              Download Backup ZIP
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Restore Backup</CardTitle>
            <CardDescription>
              Pulihkan database dan file storage dari arsip ZIP. Tabel yang
              ikut di-backup akan dikosongkan lalu diisi ulang dari ZIP —
              data lokal yang tidak ada di arsip ikut terhapus. File storage
              ditimpa per key, tidak dihapus massal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Operasi destruktif</AlertTitle>
              <AlertDescription>
                Restore mengganti isi database. Session login saat ini tidak
                berlaku lagi setelah selesai; Anda akan diarahkan ke halaman
                login.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleRestore} className="space-y-3">
              <Input ref={fileRef} type="file" accept=".zip" required />
              <Button type="submit" variant="destructive" disabled={restoring}>
                {restoring ? "Memulihkan..." : "Restore dari ZIP"}
              </Button>
            </form>
            {result ? (
              <div className="mt-4 rounded-lg border p-4 text-sm">
                <p className="font-medium">
                  {result.files_restored} file storage dipulihkan
                  {result.files_failed
                    ? ` (${result.files_failed} gagal)`
                    : ""}
                </p>
                {restoredTables.length > 0 ? (
                  <ul className="mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
                    {restoredTables.map(([table, n]) => (
                      <li key={table}>
                        {table}: {n} baris
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    Tidak ada data database di dalam arsip.
                  </p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
