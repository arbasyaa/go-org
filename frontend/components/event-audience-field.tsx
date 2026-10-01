"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import type { Division, Role } from "@/lib/types"

export type EventAudienceValue = {
  audience: "all" | "custom"
  divisionIds: number[]
  roleIds: number[]
}

type Props = {
  value: EventAudienceValue
  onChange: (value: EventAudienceValue) => void
  divisions: Division[]
  roles: Role[]
  /** Jumlah anggota per divisi/role — membantu admin menimbang pilihan. */
  counts?: Map<number, number>
  /** Jumlah anggota aktif, untuk label tombol "Semua Divisi". */
  activeMemberCount?: number | null
}

function toggle(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

/** Ringkasan cakupan yang sedang dipilih, ditampilkan sebagai satu baris teks. */
export function describeAudience(value: EventAudienceValue, divisions: Division[], roles: Role[]) {
  if (value.audience === "all") return "Semua anggota"
  const parts: string[] = []
  const divisionNames = value.divisionIds
    .map((id) => divisions.find((d) => d.id === id)?.name)
    .filter(Boolean)
  const roleNames = value.roleIds
    .map((id) => roles.find((r) => r.id === id)?.name)
    .filter(Boolean)
  if (divisionNames.length) parts.push(`Divisi ${divisionNames.join(", ")}`)
  if (roleNames.length) parts.push(`Role ${roleNames.join(", ")}`)
  return parts.length ? parts.join(" · ") : "Belum ada peserta"
}

export function EventAudienceField({
  value,
  onChange,
  divisions,
  roles,
  counts,
  activeMemberCount,
}: Props) {
  const custom = value.audience === "custom"
  const withCount = (name: string, id: number) => {
    const count = counts?.get(id)
    return count != null ? `${name} (${count})` : name
  }

  return (
    <Field className="gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel>Untuk siapa?</FieldLabel>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={value.audience === "all" ? "default" : "outline"}
            onClick={() =>
              onChange({ audience: "all", divisionIds: [], roleIds: [] })
            }
          >
            Semua Divisi
          </Button>
          <Button
            type="button"
            size="sm"
            variant={custom ? "default" : "outline"}
            onClick={() => onChange({ ...value, audience: "custom" })}
          >
            Pilih Peserta
          </Button>
        </div>
      </div>

      {value.audience === "all" ? (
        <p className="text-sm text-muted-foreground">
          Seluruh anggota aktif
          {activeMemberCount != null ? ` (${activeMemberCount} orang)` : ""} menjadi
          peserta dan wajib absen.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Divisi</p>
            {divisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada divisi</p>
            ) : (
              divisions.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={value.divisionIds.includes(d.id)}
                    onCheckedChange={() =>
                      onChange({
                        ...value,
                        divisionIds: toggle(value.divisionIds, d.id),
                      })
                    }
                  />
                  {withCount(d.name, d.id)}
                </label>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Role</p>
            {roles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada role</p>
            ) : (
              roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={value.roleIds.includes(r.id)}
                    onCheckedChange={() =>
                      onChange({
                        ...value,
                        roleIds: toggle(value.roleIds, r.id),
                      })
                    }
                  />
                  {withCount(r.name, r.id)}
                </label>
              ))
            )}
          </div>
          <p className="text-sm text-muted-foreground md:col-span-2">
            {describeAudience(value, divisions, roles)}. Divisi dan role saling
            menambah, jadi anggota yang masuk salah satunya ikut jadi peserta.
          </p>
        </div>
      )}
    </Field>
  )
}
