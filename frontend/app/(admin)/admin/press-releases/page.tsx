"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ColumnDef } from "@tanstack/react-table"
import { ExternalLinkIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  AdvancedDataTable,
  AdvancedResourcePage,
  ConfirmDialog,
  FormDialog,
  sortableHeader,
} from "@/components/advanced-table"
import { ImageUploadField } from "@/components/image-upload-field"
import { ErrorState } from "@/components/page-states"
import { useAuth } from "@/components/providers/auth-provider"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { formatDate, unwrapList } from "@/lib/format"
import type { PressRelease } from "@/lib/public-content"
import { storageUrl } from "@/lib/storage-url"

const CATEGORY_SUGGESTIONS = ["Siaran Pers", "Kegiatan", "Prestasi", "Kerja Sama"]
const EXCERPT_MAX = 500

type FormState = {
  title: string
  slug: string
  category: string
  excerpt: string
  content: string
  published: boolean
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  category: "",
  excerpt: "",
  content: "",
  published: false,
}

export default function AdminPressReleasesPage() {
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("press_release.manage")
  const { data, loading, error, refetch } = useApi(async () => {
    const result = await apiRequest<
      PressRelease[] | { items: PressRelease[] }
    >("/press_releases")
    return unwrapList(result)
  })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PressRelease | null>(null)
  const [deleting, setDeleting] = useState<PressRelease | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [removeCover, setRemoveCover] = useState(false)

  const stats = useMemo(
    () => [
      { label: "Total", value: data?.length ?? 0 },
      {
        label: "Terbit",
        value: data?.filter((p) => p.published).length ?? 0,
      },
      {
        label: "Draf",
        value: data?.filter((p) => !p.published).length ?? 0,
      },
    ],
    [data]
  )

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setCoverFile(null)
    setRemoveCover(false)
    setOpen(true)
  }

  function openEdit(row: PressRelease) {
    setEditing(row)
    setForm({
      title: row.title,
      slug: row.slug ?? "",
      category: row.category ?? "",
      excerpt: row.excerpt ?? "",
      content: row.content ?? "",
      published: row.published,
    })
    setCoverFile(null)
    setRemoveCover(false)
    setOpen(true)
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const body = new FormData()
      body.append("title", form.title)
      body.append("slug", form.slug)
      body.append("category", form.category)
      body.append("excerpt", form.excerpt)
      body.append("content", form.content)
      body.append("published", form.published ? "true" : "false")
      if (coverFile) body.append("cover", coverFile)
      else if (editing && removeCover) body.append("remove_cover", "true")
      if (editing) {
        await apiRequest(`/press_releases/${editing.id}`, {
          method: "PUT",
          body,
        })
      } else {
        await apiRequest("/press_releases", { method: "POST", body })
      }
      toast.success(editing ? "Press release diperbarui" : "Press release dibuat")
      setOpen(false)
      void refetch()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan press release"
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await apiRequest(`/press_releases/${deleting.id}`, { method: "DELETE" })
      toast.success("Press release dihapus")
      setDeleting(null)
      void refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const columns = useMemo<ColumnDef<PressRelease>[]>(
    () => [
      {
        id: "judul",
        accessorKey: "title",
        header: sortableHeader("Judul"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.title}</span>
        ),
      },
      {
        id: "kategori",
        accessorKey: "category",
        header: "Kategori",
        cell: ({ row }) => row.original.category || "-",
      },
      {
        id: "status",
        accessorKey: "published",
        header: "Status",
        cell: ({ row }) =>
          row.original.published ? (
            <Badge>Published</Badge>
          ) : (
            <Badge variant="secondary">Draft</Badge>
          ),
      },
      {
        id: "terbit",
        accessorKey: "published_at",
        header: sortableHeader("Terbit"),
        cell: ({ row }) => formatDate(row.original.published_at),
      },
      {
        id: "aksi",
        enableHiding: false,
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            {row.original.published && row.original.slug ? (
              <Button
                variant="outline"
                size="sm"
                render={
                  <Link
                    href={`/berita/${row.original.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <ExternalLinkIcon className="mr-1 size-4" />
                Lihat publik
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className="mr-1 size-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleting(row.original)}
            >
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
      <AdvancedResourcePage
        title="Press Release"
        crumbs={[{ label: "Admin" }, { label: "Press Release" }]}
      >
        <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
      </AdvancedResourcePage>
    )
  }

  return (
    <AdvancedResourcePage
      title="Press Release"
      crumbs={[
        { label: "Admin", href: "/dashboard" },
        { label: "Press Release" },
      ]}
      stats={stats}
      actions={<Button onClick={openCreate}>Buat Press Release</Button>}
    >
      <AdvancedDataTable
        columns={columns}
        data={data ?? []}
        loading={loading}
        error={error}
        emptyMessage="Belum ada press release"
        searchPlaceholder="Cari press release..."
        getRowId={(row) => String(row.id)}
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit Press Release" : "Press Release Baru"}
        onSubmit={handleSubmit}
        saving={saving}
        className="sm:max-w-2xl"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Judul</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Slug (opsional)</FieldLabel>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="dibuat otomatis dari judul"
            />
          </Field>
          <Field>
            <FieldLabel>Kategori</FieldLabel>
            <Input
              list="press-release-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <datalist id="press-release-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field>
            <FieldLabel>Ringkasan</FieldLabel>
            <Textarea
              rows={3}
              maxLength={EXCERPT_MAX}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
            <FieldDescription>
              {form.excerpt.length}/{EXCERPT_MAX}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Isi</FieldLabel>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="Tulis isi press release..."
            />
          </Field>
          <Field>
            <FieldLabel>Cover</FieldLabel>
            <ImageUploadField
              value={coverFile}
              onChange={(file) => {
                setCoverFile(file)
                // Hapus manual (file null) pada record yang punya cover lama.
                setRemoveCover(file === null && !!editing?.cover_url)
              }}
              existingUrl={editing?.cover_url ? storageUrl(editing.cover_url) : null}
              alt="Pratinjau cover"
            />
          </Field>
          <Field orientation="horizontal">
            <Switch
              checked={form.published}
              onCheckedChange={(published) => setForm({ ...form, published })}
            />
            <FieldLabel>Terbitkan</FieldLabel>
          </Field>
        </FieldGroup>
      </FormDialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(next) => {
          if (!next) setDeleting(null)
        }}
        title="Hapus Press Release"
        description={`Apakah Anda yakin ingin menghapus "${deleting?.title}"?`}
        onConfirm={handleDelete}
      />
    </AdvancedResourcePage>
  )
}
