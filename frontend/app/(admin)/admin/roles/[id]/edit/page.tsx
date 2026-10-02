"use client"

import { useState, use } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingState } from "@/components/page-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import {
  permissionScope,
  SCOPE_LABELS,
  type PermissionScope,
} from "@/lib/permission-scopes"
import { unwrapList } from "@/lib/format"
import type { Permission, Role } from "@/lib/types"

interface RolePermissionsResponse {
  permissions?: Permission[]
  assigned_ids?: number[]
  permission_ids?: number[]
}

const SCOPE_ORDER: PermissionScope[] = ["member", "admin", "both"]

export default function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, loading, error } = useApi(
    () => apiRequest<RolePermissionsResponse>(`/roles/${id}/permissions`),
    [id]
  )
  const allPermissions = useApi(() =>
    apiRequest<Permission[] | { items: Permission[] }>("/permissions").then(
      unwrapList
    )
  )
  // Detail role diambil dari daftar yang sudah ada — tidak perlu endpoint baru.
  const rolesQuery = useApi(async () =>
    unwrapList(await apiRequest<Role[] | { items: Role[] }>("/roles"))
  )
  const [selectedOverride, setSelectedOverride] = useState<number[] | null>(
    null
  )
  const [saving, setSaving] = useState(false)
  const [detailsOverride, setDetailsOverride] = useState<{
    name: string
    description: string
  } | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)

  const role = rolesQuery.data?.find((r) => r.id === Number(id))
  const details = detailsOverride ?? {
    name: role?.name ?? "",
    description: role?.description ?? "",
  }

  const baseSelected = data?.assigned_ids ?? data?.permission_ids ?? []
  const selected = selectedOverride ?? baseSelected

  function togglePermission(permissionId: number, checked: boolean) {
    const current = selectedOverride ?? baseSelected
    setSelectedOverride(
      checked
        ? [...current, permissionId]
        : current.filter((pid) => pid !== permissionId)
    )
  }

  async function handleSaveDetails() {
    setSavingDetails(true)
    try {
      await apiRequest(`/roles/${id}`, { method: "PUT", body: details })
      toast.success("Role diperbarui")
      setDetailsOverride(null)
      void rolesQuery.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await apiRequest(`/roles/${id}/permissions`, {
        method: "PUT",
        body: { permission_ids: selected },
      })
      toast.success("Permission role diperbarui")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const permissions = allPermissions.data ?? data?.permissions ?? []

  const groupedByScope = SCOPE_ORDER.reduce<
    Record<PermissionScope, Record<string, Permission[]>>
  >(
    (acc, scope) => {
      acc[scope] = {}
      return acc
    },
    { member: {}, admin: {}, both: {} }
  )

  for (const perm of permissions) {
    const scope = permissionScope(perm.code)
    const modName = perm.module || "other"
    groupedByScope[scope][modName] = groupedByScope[scope][modName] ?? []
    groupedByScope[scope][modName].push(perm)
  }

  return (
    <>
      <PageHeader
        title="Edit Role"
        crumbs={[
          { label: "Role", href: "/admin/roles" },
          { label: role?.name ?? "Edit" },
        ]}
      />
      <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
        <Card>
          <CardHeader>
            <CardTitle>Detail Role</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Nama Role</FieldLabel>
                <Input
                  value={details.name}
                  onChange={(e) =>
                    setDetailsOverride({ ...details, name: e.target.value })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Deskripsi</FieldLabel>
                <Textarea
                  value={details.description}
                  onChange={(e) =>
                    setDetailsOverride({
                      ...details,
                      description: e.target.value,
                    })
                  }
                />
              </Field>
            </FieldGroup>
            {role?.is_system ? (
              <p className="text-xs text-muted-foreground">
                Role sistem (Admin): boleh diganti namanya, tapi permission-nya
                selalu penuh dan tidak bisa dikurangi lewat matrix di bawah.
              </p>
            ) : null}
            <div>
              <Button onClick={handleSaveDetails} disabled={savingDetails}>
                {savingDetails ? "Menyimpan..." : "Simpan Detail"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading || allPermissions.loading ? <LoadingState rows={6} /> : null}
        {error ? <ErrorState message={error} /> : null}

        {SCOPE_ORDER.map((scope) => {
          const modules = groupedByScope[scope]
          const moduleEntries = Object.entries(modules).filter(
            ([, perms]) => perms.length > 0
          )
          if (moduleEntries.length === 0) return null

          return (
            <section key={scope} className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{SCOPE_LABELS[scope]}</h2>
                <Badge variant="secondary">
                  {scope === "member"
                    ? "Sidebar anggota / dashboard"
                    : scope === "admin"
                      ? "Panel admin /admin/*"
                      : "Portal & admin"}
                </Badge>
              </div>
              {moduleEntries.map(([modName, perms]) => (
                <div key={modName} className="rounded-lg border p-4">
                  <h3 className="mb-3 font-medium capitalize">{modName}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2 rounded-md border p-3"
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selected.includes(perm.id)}
                          onChange={(e) =>
                            togglePermission(perm.id, e.target.checked)
                          }
                        />
                        <span className="leading-snug">
                          <span className="font-medium">{perm.code}</span>
                          {perm.description ? (
                            <span className="block text-xs text-muted-foreground">
                              {perm.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )
        })}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Permission"}
          </Button>
          <Button variant="outline" render={<Link href="/admin/roles" />}>
            Kembali
          </Button>
        </div>
      </div>
    </>
  )
}
