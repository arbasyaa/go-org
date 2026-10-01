"use client"

import { use, useMemo } from "react"
import { PageHeader } from "@/components/page-header"
import { ErrorState, LoadingState } from "@/components/page-states"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useApi } from "@/hooks/use-api"
import { apiRequest } from "@/lib/api"
import { divisionColorMap } from "@/lib/division-color"
import { unwrapList } from "@/lib/format"
import type { Division } from "@/lib/types"

export default function DivisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, loading, error } = useApi(
    async () =>
      unwrapList(await apiRequest<Division[] | { items: Division[] }>("/divisions")),
    [id]
  )
  const division = useMemo(
    () => (data ?? []).find((d) => String(d.id) === id) ?? null,
    [data, id]
  )
  // Warna dihitung dari daftar lengkap supaya sama dengan chip kalender.
  const colors = useMemo(() => divisionColorMap(data ?? []), [data])

  return (
    <>
      <PageHeader
        title="Divisi"
        crumbs={[{ label: division?.name ?? "Divisi" }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {loading ? <LoadingState rows={3} /> : null}
        {error ? <ErrorState message={error} /> : null}
        {division ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-3 rounded-full"
                  style={{ backgroundColor: colors.get(division.id) }}
                />
                {division.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {division.description ?? "Tidak ada deskripsi"}
              </p>
            </CardContent>
          </Card>
        ) : !loading && !error ? (
          <ErrorState message="Divisi tidak ditemukan" />
        ) : null}
      </div>
    </>
  )
}
