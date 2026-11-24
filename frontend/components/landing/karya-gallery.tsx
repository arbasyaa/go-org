"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { storageUrl } from "@/lib/storage-url"

/**
 * Galeri foto karya: thumbnail kecil (supaya ruang deskripsi tetap luas) dan
 * popup saat diklik, bisa digeser antar foto dengan tombol atau panah keyboard.
 */
export function KaryaGallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)

  const go = useCallback(
    (step: number) => setIndex((i) => (i + step + images.length) % images.length),
    [images.length]
  )

  useEffect(() => {
    if (!open || images.length < 2) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    // Fase capture: focus-trap dialog memakai panah untuk navigasi internal dan
    // menghentikan event sebelum sampai ke window (bubble phase).
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [open, images.length, go])

  if (!images.length) return null

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <li key={`${src}-${i}`}>
            <button
              type="button"
              onClick={() => {
                setIndex(i)
                setOpen(true)
              }}
              aria-label={`Lihat foto ${i + 1} dari ${images.length}`}
              className="block w-full overflow-hidden rounded-lg border border-[var(--landing-ink)]/12 transition-opacity hover:opacity-80"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={storageUrl(src)}
                alt=""
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(92vw,1100px)] border-0 bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={storageUrl(images[index])}
              alt={`${title} — foto ${index + 1} dari ${images.length}`}
              className="max-h-[82vh] w-full rounded-[var(--landing-radius-md)] object-contain"
            />
            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Foto sebelumnya"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white transition-colors hover:bg-black/75"
                >
                  <ChevronLeftIcon className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Foto berikutnya"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white transition-colors hover:bg-black/75"
                >
                  <ChevronRightIcon className="size-5" />
                </button>
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white tabular-nums">
                  {index + 1} / {images.length}
                </p>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
