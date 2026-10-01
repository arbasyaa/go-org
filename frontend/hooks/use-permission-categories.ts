"use client"

import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { unwrapList } from "@/lib/format"
import type { PermissionCategory } from "@/lib/types"

/** Master data kategori izin (cukup login) — dipakai form pengajuan & halaman kategori. */
export function usePermissionCategories() {
  const { data, loading, refetch } = useApi(async () => {
    const result = await apiRequest<
      PermissionCategory[] | { items: PermissionCategory[] }
    >("/permission_categories")
    return unwrapList(result)
  })
  return { categories: data ?? [], loading, refetch }
}
