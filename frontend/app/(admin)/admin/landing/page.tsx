"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingState } from "@/components/page-states"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/hooks/use-api"
import { updateSettingsCache } from "@/hooks/use-settings"
import { apiRequest } from "@/lib/api"
import type { OrganizationSettings } from "@/lib/types"

const LANDING_SECTIONS = [
  { key: "about", label: "Tentang" },
  { key: "programs", label: "Program kerja" },
  { key: "press", label: "Berita" },
  { key: "members", label: "Anggota" },
  { key: "officials", label: "Pengurus" },
  { key: "merch", label: "Merchandise" },
  { key: "invitation", label: "Undangan" },
  { key: "cta", label: "Ajakan / CTA" },
] as const

/** Key hilang / JSON rusak = tampil (true). */
function parseSections(raw?: string): Record<string, boolean> {
  try {
    const value = raw ? JSON.parse(raw) : {}
    return value && typeof value === "object" ? value : {}
  } catch {
    return {}
  }
}

export default function AdminLandingPage() {
  const { hasPermission, loading: authLoading } = useAuth()
  const allowed = hasPermission("landing.manage")
  const { data, loading, error, setData } = useApi(() =>
    apiRequest<OrganizationSettings>("/settings")
  )
  const [sections, setSections] = useState<Record<string, boolean> | null>(null)
  const [saving, setSaving] = useState(false)

  const current = sections ?? parseSections(data?.landing_sections)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await apiRequest<OrganizationSettings>(
        "/landing_sections",
        {
          method: "PUT",
          body: { landing_sections: JSON.stringify(current) },
        }
      )
      setData(updated)
      updateSettingsCache(updated)
      setSections(null)
      toast.success("Tampilan landing page berhasil disimpan")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const crumbs = [{ label: "Admin" }, { label: "Tampilan Landing Page" }]

  if (!authLoading && !allowed) {
    return (
      <>
        <PageHeader title="Tampilan Landing Page" crumbs={crumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ErrorState message="Anda tidak memiliki akses ke halaman ini." />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Tampilan Landing Page" crumbs={crumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {loading || authLoading ? <LoadingState rows={5} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {data && allowed ? (
          <Card>
            <CardHeader>
              <CardTitle>Section landing page</CardTitle>
              <CardDescription>
                Pilih section yang tampil di halaman depan. Hero selalu tampil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave}>
                <FieldGroup>
                  {LANDING_SECTIONS.map(({ key, label }) => (
                    <Field
                      key={key}
                      className="flex flex-row items-center justify-between rounded-lg border p-3"
                    >
                      <FieldLabel>{label}</FieldLabel>
                      <Switch
                        checked={current[key] !== false}
                        onCheckedChange={(checked) =>
                          setSections({ ...current, [key]: checked })
                        }
                      />
                    </Field>
                  ))}
                  <Button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan"}
                  </Button>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  )
}
