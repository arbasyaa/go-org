import { notFound } from "next/navigation"
import { SignupForm } from "@/components/signup-form"
import { serverPublicGet } from "@/lib/server-api"

/**
 * Halaman pendaftaran mandiri. Alamatnya sengaja tidak dipublikasikan (bukan
 * `/register`, dan tidak ada tautan dari halaman login) — pendaftaran normal
 * lewat Sekretaris Wilayah.
 *
 * `allow_self_register = false` (bawaan) membuat halaman ini 404, sesuai PRD
 * §2.1: pendaftaran publik disembunyikan dan user hanya ditambah admin.
 */
export const dynamic = "force-dynamic"

export default async function RegisterPage() {
  const settings = await serverPublicGet<{ allow_self_register?: boolean }>("/settings")
  if (!settings) throw new Error("pengaturan organisasi belum tersedia")
  if (!settings.allow_self_register) notFound()

  return <SignupForm />
}
