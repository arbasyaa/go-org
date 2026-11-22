"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import {
  CalendarPlusIcon,
  EyeIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  sortableHeader,
} from "@/components/advanced-table"
import { FilePreviewDialog } from "@/components/file-preview-dialog"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { useAuth } from "@/components/providers/auth-provider"
import { apiRequest } from "@/lib/api"
import { formatDate, formatDateOnly, unwrapList } from "@/lib/format"
import type { Invitation } from "@/lib/invitation"
import { storageUrl } from "@/lib/storage-url"

export default function InvitationsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("invitations.manage")
  const canConvert = canManage && hasPermission("events.create")

  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<Invitation[] | { items: Invitation[] }>(
      "/invitations"
    )
    return unwrapList(result)
  })

  const [preview, setPreview] = useState<Invitation | null>(null)
  const [deleting, setDeleting] = useState<Invitation | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const rows = useMemo(() => data ?? [], [data])

  async function convert(invitation: Invitation) {
    setBusyId(invitation.id)
    try {
      await apiRequest(`/invitations/${invitation.id}/convert`, { method: "POST" })
      toast.success("Undangan dijadikan event dan masuk ke kalender")
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengonversi")
    } finally {
      setBusyId(null)
    }
  }
  async function remove(invitation: Invitation) {
    setBusyId(invitation.id)
    try {
      await apiRequest(`/invitations/${invitation.id}`, { method: "DELETE" })
      toast.success("Undangan dihapus")
      setDeleting(null)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    } finally {
      setBusyId(null)
    }
  }

  // Sengaja tidak dimemo: handler di dalamnya menutup state (busyId, deleting),
  // jadi array kolom toh berubah tiap render — memo hanya menambah deps.
  const columns: ColumnDef<Invitation>[] = [
    {
      accessorKey: "organization_name",
      header: sortableHeader("Nama Himpunan"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.organization_name}</span>
      ),
    },
    {
      accessorKey: "event_name",
      header: sortableHeader("Nama Acara"),
    },
    {
      accessorKey: "event_date",
      header: sortableHeader("Tanggal Acara"),
      cell: ({ row }) => formatDateOnly(row.original.event_date),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status === "converted" ? "converted" : "submitted"}
        />
      ),
    },
    {
      id: "aksi",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        const inv = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreview(inv)}
            >
              <EyeIcon data-icon="inline-start" />
              PDF
            </Button>
            {canConvert && inv.status !== "converted" ? (
              <Button
                variant="default"
                size="sm"
                disabled={busyId === inv.id}
                onClick={() => convert(inv)}
              >
                <CalendarPlusIcon data-icon="inline-start" />
                Buat event
              </Button>
            ) : null}
            {canManage ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Hapus undangan ${inv.event_name}`}
                disabled={busyId === inv.id}
                onClick={() => setDeleting(inv)}
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
        )
      },
    },
  ]

  const pending = rows.filter((r) => r.status !== "converted").length
  const converted = rows.length - pending

  return (
    <>
      <AdvancedResourcePage
        title="Kotak Masuk Undangan"
        crumbs={[{ label: "Undangan" }]}
        stats={[
          { label: "Belum jadi event", value: pending },
          { label: "Sudah jadi event", value: converted },
          { label: "Total undangan", value: rows.length },
        ]}
        actions={
          <p className="text-sm text-muted-foreground">
            Formulir publik:{" "}
            <Link href="/undangan" className="underline underline-offset-4">
              /undangan
            </Link>
          </p>
        }
      >
        <AdvancedDataTable
          columns={columns}
          data={rows}
          loading={loading}
          error={error}
          emptyMessage="Belum ada undangan masuk."
          searchPlaceholder="Cari himpunan atau acara..."
          getRowId={(row) => String(row.id)}
        />
      </AdvancedResourcePage>

      <FilePreviewDialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        url={preview?.attachment_url ? storageUrl(preview.attachment_url) : ""}
        fileName={preview?.attachment_name ?? "undangan.pdf"}
        fileSize={preview?.attachment_size ?? null}
        fileDate={preview ? formatDate(preview.created_at) : null}
        kindLabel={preview ? `Undangan dari ${preview.organization_name}` : undefined}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus undangan?"
        description={
          deleting
            ? `Undangan "${deleting.event_name}" dari ${deleting.organization_name} akan dihapus permanen.`
            : undefined
        }
        confirmLabel="Hapus"
        confirming={busyId === deleting?.id}
        onConfirm={async () => {
          if (deleting) await remove(deleting)
        }}
      />
    </>
  )
}
