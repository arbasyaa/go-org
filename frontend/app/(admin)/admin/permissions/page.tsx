"use client"

import { useCallback, useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { EyeIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  sortableHeader,
} from "@/components/advanced-table"
import { StatusBadge } from "@/components/status-badge"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatDate, unwrapList } from "@/lib/format"
import { storageUrl } from "@/lib/storage-url"
import type { PermissionRequest } from "@/lib/types"

type PendingAction = {
  type: "approve" | "reject" | "delete"
  row: PermissionRequest
}

const ACTION_COPY: Record<
  PendingAction["type"],
  { title: string; confirmLabel: string; destructive: boolean }
> = {
  approve: {
    title: "Setujui pengajuan izin?",
    confirmLabel: "Setujui",
    destructive: false,
  },
  reject: {
    title: "Tolak pengajuan izin?",
    confirmLabel: "Tolak",
    destructive: true,
  },
  delete: {
    title: "Hapus pengajuan izin?",
    confirmLabel: "Hapus",
    destructive: true,
  },
}

export default function AdminPermissionsPage() {
  const { hasPermission } = useAuth()
  // Kadiv/Sekdiv memegang approve_own: hanya event yang mereka kelola, dan
  // tidak boleh menghapus pengajuan (itu khusus approver global).
  const canApproveAll = hasPermission("attendance.approve")
  const { data, loading, error, setData } = useApi(async () => {
    const result = await apiRequest<
      PermissionRequest[] | { items: PermissionRequest[] }
    >("/attendance/permission_requests")
    return unwrapList(result)
  })
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [note, setNote] = useState("")
  const [processing, setProcessing] = useState(false)
  const [previewProof, setPreviewProof] = useState<PermissionRequest | null>(
    null
  )

  const rows = useMemo(() => data ?? [], [data])
  const stats = useMemo(
    () => [
      { label: "Total", value: rows.length },
      {
        label: "Pending",
        value: rows.filter((r) => r.status === "pending").length,
      },
      {
        label: "Disetujui",
        value: rows.filter((r) => r.status === "approved").length,
      },
      {
        label: "Ditolak",
        value: rows.filter((r) => r.status === "rejected").length,
      },
    ],
    [rows]
  )

  const runPendingAction = useCallback(async () => {
    if (!pendingAction) return
    const { type, row } = pendingAction
    setProcessing(true)
    try {
      if (type === "delete") {
        await apiRequest(`/attendance/permission_requests/${row.id}`, {
          method: "DELETE",
        })
        setData((prev) => prev?.filter((item) => item.id !== row.id) ?? null)
        toast.success("Pengajuan izin dihapus")
      } else {
        await apiRequest(`/attendance/permission_requests/${row.id}`, {
          method: "PUT",
          body: { action: type, note: note.trim() },
        })
        setData(
          (prev) =>
            prev?.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    status: type === "approve" ? "approved" : "rejected",
                    review_note: note.trim(),
                  }
                : item
            ) ?? null
        )
        toast.success(
          `Pengajuan ${type === "approve" ? "disetujui" : "ditolak"}`
        )
      }
      setPendingAction(null)
      setNote("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses")
    } finally {
      setProcessing(false)
    }
  }, [pendingAction, note, setData])

  const columns = useMemo<ColumnDef<PermissionRequest>[]>(
    () => [
      {
        id: "pengaju",
        accessorFn: (row) =>
          row.user?.full_name || row.user?.username || `User #${row.user_id}`,
        header: sortableHeader("Pengaju"),
      },
      {
        id: "event",
        accessorFn: (row) => row.event?.title ?? `Event #${row.event_id}`,
        header: "Event",
      },
      {
        id: "kategori",
        accessorFn: (row) => row.category?.name ?? `Kategori #${row.category_id}`,
        header: sortableHeader("Kategori"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.category?.name ?? "-"}</span>
        ),
      },
      {
        id: "alasan",
        accessorKey: "reason",
        header: "Keterangan",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.reason?.trim() ? row.original.reason : "-"}
          </span>
        ),
      },
      {
        id: "bukti",
        enableSorting: false,
        header: "Bukti",
        cell: ({ row }) =>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewProof(row.original)}
          >
            <EyeIcon data-icon="inline-start" />
            Review
          </Button>,
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "diajukan",
        accessorKey: "created_at",
        header: sortableHeader("Diajukan"),
        cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        id: "aksi",
        enableHiding: false,
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {row.original.status === "pending" ? (
              <>
                <Button
                  size="sm"
                  onClick={() =>
                    setPendingAction({ type: "approve", row: row.original })
                  }
                >
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setPendingAction({ type: "reject", row: row.original })
                  }
                >
                  Tolak
                </Button>
              </>
            ) : null}
            {canApproveAll ? (
              <Button
                size="sm"
                variant="outline"
                aria-label="Hapus pengajuan"
                onClick={() =>
                  setPendingAction({ type: "delete", row: row.original })
                }
              >
                <Trash2Icon />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canApproveAll]
  )

  const actionCopy = pendingAction ? ACTION_COPY[pendingAction.type] : null
  const actionTarget = pendingAction
    ? `${
        pendingAction.row.user?.full_name ??
        pendingAction.row.user?.username ??
        `User #${pendingAction.row.user_id}`
      }: ${pendingAction.row.event?.title ?? `Event #${pendingAction.row.event_id}`}`
    : ""

  return (
    <AdvancedResourcePage
      title="Approval Perizinan"
      crumbs={[
        { label: "Admin", href: "/admin/settings" },
        { label: "Approval Perizinan" },
      ]}
      stats={stats}
    >
      {!canApproveAll ? (
        <p className="text-sm text-muted-foreground">
          Anda menyetujui izin untuk event yang Anda kelola (pembuat atau divisi
          penyelenggara). Pengajuan event lain hanya terlihat oleh approver
          global.
        </p>
      ) : null}
      <AdvancedDataTable
        columns={columns}
        data={rows}
        loading={loading}
        error={error}
        emptyMessage="Tidak ada pengajuan"
        searchPlaceholder="Cari pengaju, event, alasan..."
        getRowId={(row) => String(row.id)}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
        title={actionCopy?.title ?? ""}
        description={
          pendingAction
            ? pendingAction.type === "delete"
              ? `Pengajuan izin ${actionTarget} akan dihapus permanen. Jika izin sudah disetujui/ditolak, catatan absensinya ikut dihapus sehingga anggota bisa absen atau mengajukan izin ulang.`
              : `Pengajuan izin ${actionTarget} akan ${
                  pendingAction.type === "approve" ? "disetujui" : "ditolak"
                }.`
            : undefined
        }
        confirmLabel={actionCopy?.confirmLabel}
        destructive={actionCopy?.destructive}
        confirming={processing}
        // Hapus tidak butuh catatan; setujui/tolak boleh diberi alasan yang
        // langsung terbaca pengaju di halaman "Perizinan Saya".
        noteLabel={
          pendingAction?.type === "reject"
            ? "Alasan penolakan (opsional)"
            : "Catatan untuk pengaju (opsional)"
        }
        notePlaceholder={
          pendingAction?.type === "reject"
            ? "mis. bukti kurang jelas, ajukan ulang dengan surat keterangan"
            : "mis. disetujui, lain kali lampirkan surat dokter"
        }
        note={note}
        onNoteChange={
          pendingAction?.type === "delete" ? undefined : setNote
        }
        onConfirm={runPendingAction}
      />

      <Dialog
        open={Boolean(previewProof)}
        onOpenChange={(open) => {
          if (!open) setPreviewProof(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Pengajuan Izin</DialogTitle>
            <DialogDescription>
              {previewProof
                ? `${
                    previewProof.user?.full_name ??
                    previewProof.user?.username ??
                    `User #${previewProof.user_id}`
                  } · ${
                    previewProof.event?.title ??
                    `Event #${previewProof.event_id}`
                  } · diajukan ${formatDate(previewProof.created_at)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {previewProof ? (
            <div className="flex min-w-0 flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Kategori</p>
                  <p className="text-sm font-medium">
                    {previewProof.category?.name ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={previewProof.status} />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Keterangan</p>
                <p className="text-sm whitespace-pre-wrap">
                  {previewProof.reason?.trim() || "Tidak ada keterangan"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Bukti gambar</p>
                {previewProof.proof_url ? (
                  <div className="mt-1 flex flex-col gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={storageUrl(previewProof.proof_url)}
                      alt={`Bukti izin ${
                        previewProof.user?.full_name ??
                        previewProof.user?.username ??
                        `user #${previewProof.user_id}`
                      }`}
                      className="max-h-[55vh] w-full rounded-md border object-contain"
                    loading="lazy"
                    decoding="async"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      render={
                        <a
                          href={storageUrl(previewProof.proof_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <ExternalLinkIcon data-icon="inline-start" />
                      Buka di tab baru
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada bukti gambar
                  </p>
                )}
              </div>

              {previewProof.status === "pending" ? (
                <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                  <Button
                    onClick={() => {
                      setPendingAction({ type: "approve", row: previewProof })
                      setPreviewProof(null)
                    }}
                  >
                    Terima
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setPendingAction({ type: "reject", row: previewProof })
                      setPreviewProof(null)
                    }}
                  >
                    Tolak
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

    </AdvancedResourcePage>
  )
}
