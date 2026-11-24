"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingState } from "@/components/page-states"
import { KaryaGallery } from "@/components/landing/karya-gallery"
import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { Karya } from "@/lib/karya"

/**
 * Halaman kurasi satu karya: pengurus membaca isi aslinya (markdown yang sudah
 * dirender), melihat tautan repo dan foto, lalu memutuskan tayang atau tolak.
 */
export default function AdminKaryaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("karya.manage")
  const { data, loading, error, refetch } = useApi(() => apiRequest<Karya>(`/karya/${id}`), [id])
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState<"published" | "rejected" | "deleted" | null>(null)

  async function decide(status: "published" | "rejected") {
    setSaving(status)
    try {
      await apiRequest(`/karya/${id}`, {
        method: "PUT",
        body: { status, review_note: note },
      })
      toast.success(status === "published" ? "Karya ditayangkan" : "Karya ditolak")
      setNote("")
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan keputusan")
    } finally {
      setSaving(null)
    }
  }

  async function remove() {
    setSaving("deleted")
    try {
      await apiRequest(`/karya/${id}`, { method: "DELETE" })
      toast.success("Karya dihapus")
      router.push("/admin/karya")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    } finally {
      setSaving(null)
    }
  }

  const crumbs = [
    { label: "Admin", href: "/dashboard" },
    { label: "Karya", href: "/admin/karya" },
    { label: "Kurasi" },
  ]

  if (!authLoading && !allowed) {
    return (
      <>
        <PageHeader title="Kurasi Karya" crumbs={crumbs} />
        <div className="p-4 pt-0">
          <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={data?.title ?? "Kurasi Karya"} crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {loading ? <LoadingState rows={6} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {data ? (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Isi pengajuan</CardTitle>
                  <CardDescription>
                    Ditulis pengirim dalam markdown, dirender dengan aturan yang sama seperti di
                    halaman publik.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="landing-prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.about_html ?? "" }}
                  />
                </CardContent>
              </Card>

              {data.images.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Foto ({data.images.length})</CardTitle>
                    <CardDescription>Klik untuk memperbesar dan menggeser.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <KaryaGallery images={data.images} title={data.title} />
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data kiriman</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Status">
                    {data.status === "published" ? (
                      <Badge>Tayang</Badge>
                    ) : data.status === "rejected" ? (
                      <Badge variant="destructive">Ditolak</Badge>
                    ) : (
                      <Badge variant="secondary">Menunggu tinjauan</Badge>
                    )}
                  </Row>
                  <Row label="Kode">{data.code}</Row>
                  <Row label="Pengirim">{data.author_name}</Row>
                  <Row label="Asal himpunan">{data.himpunan || "-"}</Row>
                  <Row label="Masuk">{formatDate(data.created_at)}</Row>
                  <Row label="Tayang">{formatDate(data.published_at)}</Row>
                  <Row label="Suka">{data.like_count}</Row>
                  <div>
                    <p className="text-muted-foreground">Repositori</p>
                    <a
                      href={data.repo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 break-all font-medium underline underline-offset-4"
                    >
                      {data.repo_url.replace("https://github.com/", "github.com/")}
                      <ExternalLinkIcon className="size-3.5 shrink-0" />
                    </a>
                  </div>
                  {data.review_note ? (
                    <div>
                      <p className="text-muted-foreground">Catatan tersimpan</p>
                      <p className="mt-1">{data.review_note}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Keputusan kurasi</CardTitle>
                  <CardDescription>
                    Catatan di bawah tampil di halaman status pengirim, termasuk untuk penolakan.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Catatan untuk pengirim (opsional)</FieldLabel>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={3}
                        maxLength={500}
                        placeholder="mis. repo tidak publik atau memuat API key"
                      />
                      <FieldDescription>{note.length}/500 karakter</FieldDescription>
                    </Field>
                  </FieldGroup>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      disabled={saving !== null || data.status === "published"}
                      onClick={() => decide("published")}
                    >
                      <CheckIcon className="mr-1 size-4" />
                      {data.status === "published" ? "Sudah tayang" : "Publikasikan"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={saving !== null || data.status === "rejected"}
                      onClick={() => decide("rejected")}
                    >
                      <XIcon className="mr-1 size-4" />
                      {data.status === "rejected" ? "Sudah ditolak" : "Tolak"}
                    </Button>
                    <Button variant="destructive" disabled={saving !== null} onClick={remove}>
                      <Trash2Icon className="mr-1 size-4" />
                      Hapus
                    </Button>
                  </div>
                  <Button variant="ghost" className="mt-2" render={<Link href="/admin/karya" />}>
                    <ArrowLeftIcon className="mr-1 size-4" />
                    Kembali ke daftar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  )
}
