"use client"

import { useMemo } from "react"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import type { Division, Role } from "@/lib/types"

type CatalogItem = { id: number; name: string; member_count: number }

type CatalogResponse = {
  divisions: CatalogItem[]
  roles: CatalogItem[]
  member_count: number
}

/**
 * Katalog cakupan event dari GET /events/cakupan. Dipakai form create/edit
 * supaya jumlah anggota per pilihan ikut terlihat.
 */
export function useAudienceCatalog() {
  const query = useApi(() => apiRequest<CatalogResponse>("/event_audience"))
  const divisions: Division[] = useMemo(
    () => (query.data?.divisions ?? []).map((d) => ({ id: d.id, name: d.name })),
    [query.data]
  )
  const roles: Role[] = useMemo(
    () => (query.data?.roles ?? []).map((r) => ({ id: r.id, name: r.name })),
    [query.data]
  )
  const memberCount = query.data?.member_count ?? null
  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const item of query.data?.divisions ?? [])
      map.set(item.id, item.member_count)
    for (const item of query.data?.roles ?? []) map.set(item.id, item.member_count)
    return map
  }, [query.data])

  return { divisions, roles, memberCount, counts, loading: query.loading }
}
