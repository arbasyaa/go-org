"use client"

import { useMemo, useState } from "react"
import { SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingState } from "@/components/page-states"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { unwrapList } from "@/lib/format"
import { storageUrl } from "@/lib/storage-url"
import type { User } from "@/lib/types"

function memberInitials(u: User) {
  return (u.full_name || u.username || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function label(value: User["division"] | User["role"]) {
  if (!value) return "-"
  return typeof value === "string" ? value : value.name
}

export default function MembersPage() {
  const { data, loading, error } = useApi(async () =>
    unwrapList<User>(
      await apiRequest<User[] | { items: User[] }>("/members")
    )
  )
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<User | null>(null)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter((m) =>
      [m.full_name, m.username, label(m.division), label(m.role)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [data, query])

  return (
    <>
      <PageHeader title="Anggota" crumbs={[{ label: "Anggota" }]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, username, divisi..."
            className="pl-9"
          />
        </div>

        {loading ? <LoadingState rows={4} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {data && !error ? (
          filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada anggota yang cocok.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m)}
                  className="text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
                >
                  <Card className="py-4 transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center gap-3 px-4">
                      <Avatar size="lg">
                        <AvatarImage
                          src={storageUrl(m.avatar_url)}
                          alt={m.full_name}
                        />
                        <AvatarFallback>{memberInitials(m)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {m.full_name || m.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {label(m.role)} · {label(m.division)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          )
        ) : null}

        <Dialog
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) setSelected(null)
          }}
        >
          {selected ? (
            <DialogContent className="sm:max-w-sm">
              <DialogTitle className="sr-only">
                Profil {selected.full_name || selected.username}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detail profil anggota
              </DialogDescription>
              <div className="flex flex-col items-center gap-3 text-center">
                {selected.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={storageUrl(selected.avatar_url)}
                    alt={selected.full_name}
                    className="size-28 rounded-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <Avatar className="size-28">
                    <AvatarFallback className="text-2xl">
                      {memberInitials(selected)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="text-base font-medium">
                    {selected.full_name || selected.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {label(selected.role)} · {label(selected.division)}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <p>
                  <span className="text-muted-foreground">Username:</span>{" "}
                  {selected.username}
                </p>
                <p>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {selected.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Telepon:</span>{" "}
                  {selected.phone || "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">Asal:</span>{" "}
                  {selected.hometown || "-"}
                </p>
                {selected.birth_date ? (
                  <p>
                    <span className="text-muted-foreground">
                      Tanggal Lahir:
                    </span>{" "}
                    {selected.birth_date.slice(0, 10)}
                  </p>
                ) : null}
              </div>
            </DialogContent>
          ) : null}
        </Dialog>
      </div>
    </>
  )
}
