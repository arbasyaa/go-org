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
  // Divisi dan role punya ruang ID sendiri-sendiri, jadi tidak boleh satu map:
  // id 4 di divisi dan id 4 di role adalah dua entitas berbeda, dan map bersama
  // membuat angka salah satu menimpa yang lain (mis. PR tampil 0 = jumlah Staff).
  const divisionCounts = useMemo(
    () => new Map((query.data?.divisions ?? []).map((d) => [d.id, d.member_count])),
    [query.data]
  )
  const roleCounts = useMemo(
    () => new Map((query.data?.roles ?? []).map((r) => [r.id, r.member_count])),
    [query.data]
  )

  return {
    divisions,
    roles,
    memberCount,
    divisionCounts,
    roleCounts,
    loading: query.loading,
  }
}
