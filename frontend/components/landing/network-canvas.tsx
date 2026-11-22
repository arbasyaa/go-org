"use client"

import { useEffect, useRef } from "react"
import { cityNodes } from "@/lib/landing/content"

type Node = { name: string; bx: number; by: number; x: number; y: number; glow: number }
type Packet = { a: number; b: number; t: number; speed: number; color: string }

const LON = [108.85, 111.6] as const
const LAT = [-6.5, -7.95] as const

/**
 * Kanvas hero: kota-kota Jawa Tengah sebagai simpul jaringan. Sebaran titik
 * membentuk siluet provinsi; tiap simpul tersambung ke tetangga terdekatnya,
 * dan "paket data" merah/cyan mengalir di sepanjang sambungan — metafora
 * himpunan yang saling bertukar ilmu.
 *
 * Interaksi: simpul di dekat pointer tertarik halus dan menyala, nama kota
 * muncul. Performa: DPR dibatasi 2, loop berhenti saat kanvas di luar
 * viewport (IntersectionObserver) atau tab tersembunyi, pointer hanya
 * menulis koordinat. Reduced-motion: satu frame statis tanpa loop.
 */
export function NetworkCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const styles = getComputedStyle(document.documentElement)
    const red = styles.getPropertyValue("--landing-accent").trim() || "#ed3237"
    const cyan = styles.getPropertyValue("--landing-cyan").trim() || "#00a9e6"

    let width = 0
    let height = 0
    let nodes: Node[] = []
    let edges: [number, number][] = []
    const packets: Packet[] = []
    const dust = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.3,
      v: Math.random() * 0.00012 + 0.00004,
    }))
    const pointer = { x: -9999, y: -9999, active: false }
    let frame = 0
    let running = false
    let visible = true
    let stepK = 1
    // Easing eksponensial yang setara untuk stepK frame 60fps.
    const ease = (k: number) => 1 - Math.pow(1 - k, stepK)

    function layout() {
      const rect = canvas!.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Kotak peta: kanan di desktop (memberi ruang judul), penuh di ponsel.
      const wide = width >= 900
      const boxW = wide ? width * 0.6 : width * 0.96
      const boxH = boxW / 1.85
      const ox = wide ? width - boxW - width * 0.03 : (width - boxW) / 2
      const oy = wide ? height * 0.16 : height - boxH - height * 0.1

      nodes = cityNodes.map((c) => {
        const bx = ox + ((c.lon - LON[0]) / (LON[1] - LON[0])) * boxW
        const by = oy + ((c.lat - LAT[0]) / (LAT[1] - LAT[0])) * boxH
        return { name: c.name, bx, by, x: bx, y: by, glow: 0 }
      })

      // 3 tetangga terdekat per simpul, tanpa duplikat.
      const seen = new Set<string>()
      edges = []
      nodes.forEach((n, i) => {
        nodes
          .map((m, j) => ({ j, d: (m.bx - n.bx) ** 2 + (m.by - n.by) ** 2 }))
          .filter((e) => e.j !== i)
          .sort((a, b) => a.d - b.d)
          .slice(0, 3)
          .forEach(({ j }) => {
            const key = i < j ? `${i}-${j}` : `${j}-${i}`
            if (!seen.has(key)) {
              seen.add(key)
              edges.push([i, j])
            }
          })
      })
    }

    function spawnPacket() {
      if (!edges.length) return
      const [a, b] = edges[Math.floor(Math.random() * edges.length)]
      const flip = Math.random() > 0.5
      packets.push({
        a: flip ? a : b,
        b: flip ? b : a,
        t: 0,
        speed: 0.006 + Math.random() * 0.01,
        color: Math.random() > 0.45 ? cyan : red,
      })
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height)

      // Debu latar: lapisan paling belakang, bergerak paling lambat.
      ctx!.fillStyle = "rgba(244,244,250,0.35)"
      for (const d of dust) {
        if (!reduce) d.y -= d.v
        if (d.y < 0) d.y = 1
        ctx!.beginPath()
        ctx!.arc(d.x * width, d.y * height, d.r, 0, Math.PI * 2)
        ctx!.fill()
      }

      // Simpul: tarik ke pointer, kembali ke posisi dasar dengan pegas.
      for (const n of nodes) {
        const dx = pointer.x - n.bx
        const dy = pointer.y - n.by
        const dist = Math.hypot(dx, dy)
        const pull = pointer.active && dist < 160 ? (1 - dist / 160) * 18 : 0
        const tx = n.bx + (dist ? (dx / dist) * pull : 0)
        const ty = n.by + (dist ? (dy / dist) * pull : 0)
        n.x += (tx - n.x) * ease(0.12)
        n.y += (ty - n.y) * ease(0.12)
        const targetGlow = pointer.active && dist < 120 ? 1 : 0
        n.glow += (targetGlow - n.glow) * ease(0.1)
      }

      ctx!.lineWidth = 1
      for (const [i, j] of edges) {
        const a = nodes[i]
        const b = nodes[j]
        const g = Math.max(a.glow, b.glow)
        ctx!.strokeStyle = `rgba(215,213,232,${0.14 + g * 0.4})`
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }

      // Garis pointer → simpul dekat: umpan balik bahwa jaringan "merespons".
      if (pointer.active) {
        for (const n of nodes) {
          if (n.glow < 0.05) continue
          ctx!.strokeStyle = `rgba(0,169,230,${n.glow * 0.5})`
          ctx!.beginPath()
          ctx!.moveTo(pointer.x, pointer.y)
          ctx!.lineTo(n.x, n.y)
          ctx!.stroke()
        }
      }

      for (let k = packets.length - 1; k >= 0; k--) {
        const p = packets[k]
        p.t += p.speed * stepK
        if (p.t >= 1) {
          nodes[p.b].glow = Math.max(nodes[p.b].glow, 0.6)
          packets.splice(k, 1)
          continue
        }
        const a = nodes[p.a]
        const b = nodes[p.b]
        const px = a.x + (b.x - a.x) * p.t
        const py = a.y + (b.y - a.y) * p.t
        ctx!.fillStyle = p.color
        ctx!.shadowColor = p.color
        ctx!.shadowBlur = 12
        ctx!.beginPath()
        ctx!.arc(px, py, 2.2, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.shadowBlur = 0
      }

      ctx!.font = "600 10px var(--font-space-grotesk), system-ui, sans-serif"
      for (const n of nodes) {
        const r = 2.4 + n.glow * 2.6
        ctx!.fillStyle = n.glow > 0.3 ? cyan : "rgba(244,244,250,0.85)"
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx!.fill()
        if (n.glow > 0.15) {
          ctx!.fillStyle = `rgba(244,244,250,${n.glow})`
          ctx!.fillText(n.name.toUpperCase(), n.x + 8, n.y - 8)
        }
      }
    }

    // Digambar ~30fps (bukan 60): biaya canvas (shadowBlur paket) separuh.
    // stepK mengompensasi agar kecepatan gerak tetap sama seperti 60fps.
    let last = 0
    // Perangkat sentuh tidak punya interaksi pointer → cukup ~20fps (hemat baterai).
    const frameInterval = window.matchMedia("(pointer: coarse)").matches ? 48 : 30
    function loop(ts: number) {
      frame = requestAnimationFrame(loop)
      if (last && ts - last < frameInterval) return
      stepK = last ? Math.min((ts - last) / (1000 / 60), 4) : 1
      last = ts
      if (Math.random() < 1 - Math.pow(1 - 0.09, stepK) && packets.length < 26) spawnPacket()
      draw()
    }
    function start() {
      if (running || reduce || !visible || document.hidden) return
      running = true
      last = 0
      frame = requestAnimationFrame(loop)
    }
    function stop() {
      running = false
      cancelAnimationFrame(frame)
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
      pointer.active = pointer.y >= 0 && pointer.y <= rect.height
    }
    const onLeave = () => {
      pointer.active = false
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    const resize = new ResizeObserver(() => {
      layout()
      if (!running) draw()
    })
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })

    layout()
    draw()
    resize.observe(canvas)
    io.observe(canvas)
    window.addEventListener("pointermove", onPointer, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    document.addEventListener("visibilitychange", onVisibility)
    start()

    return () => {
      stop()
      resize.disconnect()
      io.disconnect()
      window.removeEventListener("pointermove", onPointer)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden className={className} />
}
