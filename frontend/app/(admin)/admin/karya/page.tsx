"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { CheckIcon, ExternalLinkIcon, EyeIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  FormDialog,
  sortableHeader,
} from "@/components/advanced-table"
import { ErrorState } from "@/components/page-states"
import { useAuth } from "@/components/providers/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatDate, unwrapList } from "@/lib/format"
import type { Karya } from "@/lib/karya"

const STATUS_LABEL: Record<string, string> = {
  review: "Menunggu tinjauan",
  published: "Tayang",
  rejected: "Ditolak",
}

type Decision = { item: Karya; status: "published" | "rejected" }

/**
 * Kurasi karya: setujui atau tolak kiriman, dengan catatan opsional yang
 * tampil di halaman status pengirim.
 */
export default function AdminKaryaPage() {
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("karya.manage")
  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<Karya[] | { items: Karya[] }>("/karya")
    return unwrapList(result)
  })
  const [decision, setDecision] = useState<Decision | null>(null)
  const [note, setNote] = useState("")
  const [deleting, setDeleting] = useState<Karya | null>(null)
  const [saving, setSaving] = useState(false)

  const stats = useMemo(
    () => [
      { label: "Total", value: data?.length ?? 0 },
      { label: "Menunggu", value: data?.filter((k) => k.status === "review").length ?? 0 },
      { label: "Tayang", value: data?.filter((k) => k.status === "published").length ?? 0 },
    ],
    [data]
  )

  function openDecision(item: Karya, status: Decision["status"]) {
    setDecision({ item, status })
    setNote("")
  }

  async function submitDecision() {
    if (!decision) return
    setSaving(true)
    try {
      await apiRequest(`/karya/${decision.item.id}`, {
        method: "PUT",
        body: { status: decision.status, review_note: note },
      })
      toast.success(
        decision.status === "published" ? "Karya ditayangkan" : "Karya ditolak"
      )
      setDecision(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan keputusan")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await apiRequest(`/karya/${deleting.id}`, { method: "DELETE" })
      toast.success("Karya dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const columns = useMemo<ColumnDef<Karya>[]>(
    () => [
      {
        id: "judul",
        accessorKey: "title",
        header: sortableHeader("Karya"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              href={`/admin/karya/${row.original.id}`}
              className="truncate font-medium underline-offset-4 hover:underline"
            >
              {row.original.title}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.author_name} · {row.original.himpunan || "-"}
            </p>
          </div>
        ),
      },
      {
        id: "kode",
        accessorKey: "code",
        header: "Kode",
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.status === "published" ? (
            <Badge>Tayang</Badge>
          ) : row.original.status === "rejected" ? (
            <Badge variant="destructive">Ditolak</Badge>
          ) : (
            <Badge variant="secondary">Menunggu</Badge>
          ),
      },
      {
        id: "like",
        accessorKey: "like_count",
        header: sortableHeader("Suka"),
        cell: ({ row }) => <span className="tabular-nums">{row.original.like_count}</span>,
      },
      {
        id: "masuk",
        accessorKey: "created_at",
        header: sortableHeader("Masuk"),
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: "aksi",
        enableHiding: false,
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              render={<Link href={`/admin/karya/${row.original.id}`} />}
            >
              <EyeIcon className="mr-1 size-4" />
              Detail
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={row.original.repo_url} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLinkIcon className="mr-1 size-4" />
              Repo
            </Button>
            {row.original.status !== "published" ? (
              <Button size="sm" onClick={() => openDecision(row.original, "published")}>
                <CheckIcon className="mr-1 size-4" />
                Publikasikan
              </Button>
            ) : null}
            {row.original.status !== "rejected" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDecision(row.original, "rejected")}
              >
                <XIcon className="mr-1 size-4" />
                Tolak
              </Button>
            ) : null}
            <Button variant="destructive" size="sm" onClick={() => setDeleting(row.original)}>
              <Trash2Icon className="mr-1 size-4" />
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  if (!authLoading && !allowed) {
    return (
      <AdvancedResourcePage title="Karya" crumbs={[{ label: "Admin" }, { label: "Karya" }]}>
        <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
      </AdvancedResourcePage>
    )
  }

  return (
    <AdvancedResourcePage
      title="Karya"
      crumbs={[{ label: "Admin", href: "/dashboard" }, { label: "Karya" }]}
      stats={stats}
    >
      <AdvancedDataTable
        columns={columns}
        data={data ?? []}
        loading={loading}
        error={error}
        emptyMessage="Belum ada karya yang diajukan"
        searchPlaceholder="Cari karya, pengirim, atau himpunan..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={decision !== null}
        onOpenChange={(open) => {
          if (!open) setDecision(null)
        }}
        title={decision?.status === "published" ? "Publikasikan karya" : "Tolak karya"}
        description={
          decision?.status === "published"
            ? "Karya langsung tayang di /karya dan bisa muncul sebagai unggulan di landing."
            : "Karya tidak akan tayang. Catatan di bawah tampil di halaman status pengirim."
        }
        onSubmit={submitDecision}
        saving={saving}
        submitLabel={decision?.status === "published" ? "Publikasikan" : "Tolak karya"}
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Catatan untuk pengirim (opsional)</FieldLabel>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={
                decision?.status === "published"
                  ? "mis. sudah sesuai ketentuan"
                  : "mis. repo tidak publik atau memuat API key"
              }
            />
            <FieldDescription>
              {decision ? `${decision.item.title} · ${STATUS_LABEL[decision.item.status]}` : ""}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        title="Hapus karya?"
        description={`${deleting?.title ?? ""} akan dihapus permanen beserta angkanya.`}
        onConfirm={handleDelete}
        destructive
      />
    </AdvancedResourcePage>
  )
}