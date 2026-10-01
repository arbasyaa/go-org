"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Satu-satunya ConfirmDialog di aplikasi (di-ekspor juga lewat
 * `components/advanced-table`). Kolom catatan opsional dipakai untuk memberi
 * alasan pada aksi yang perlu dijelaskan ke pengguna (mis. tolak/tolak izin).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  confirming = false,
  onConfirm,
  destructive = true,
  noteLabel,
  note,
  onNoteChange,
  notePlaceholder,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirming?: boolean
  onConfirm: () => void | Promise<void>
  destructive?: boolean
  noteLabel?: string
  note?: string
  onNoteChange?: (value: string) => void
  notePlaceholder?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {onNoteChange ? (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-note" className="text-xs font-medium">
              {noteLabel ?? "Catatan"}
            </Label>
            <Textarea
              id="confirm-note"
              rows={3}
              value={note ?? ""}
              placeholder={notePlaceholder}
              onChange={(e) => onNoteChange(e.target.value)}
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={confirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={confirming}
            onClick={() => void onConfirm()}
          >
            {confirming ? "Memproses..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
