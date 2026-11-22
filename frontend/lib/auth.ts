import { ApiError, apiRequest } from "@/lib/api"
import { normalizeApiData } from "@/lib/format"
import type { ApiEnvelope, LoginResponse, User } from "@/lib/types"

/**
 * Sesi = cookie HttpOnly `token` di origin Next, di-set oleh route handler
 * `/api/session/*`. JS tidak pernah membaca/menyimpan token; status login
 * diturunkan dari `GET /me`.
 */
const LEGACY_TOKEN_KEY = "myorg_token"

/** Hapus token sisa versi lama dari localStorage (cookie `token` lama yang
 * non-HttpOnly ditimpa oleh Set-Cookie HttpOnly saat login/logout). */
export function clearLegacyToken() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
  } catch {
    /* storage diblokir */
  }
}

async function sessionRequest<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/session/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let envelope: ApiEnvelope<T>
  try {
    envelope = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(res.statusText || "Request failed", res.status)
  }
  if (!res.ok || envelope.success === false) {
    throw new ApiError(
      envelope.message || "Request failed",
      res.status,
      envelope.errors
    )
  }
  return normalizeApiData(envelope.data) as T
}

/** Respons tidak lagi memuat `token` (tetap di cookie HttpOnly). */
export async function login(username: string, password: string) {
  clearLegacyToken()
  return sessionRequest<LoginResponse>("login", { username, password })
}

export async function register(payload: {
  username: string
  email: string
  password: string
  full_name: string
}) {
  clearLegacyToken()
  return sessionRequest<LoginResponse>("register", payload)
}

export async function logout() {
  clearLegacyToken()
  try {
    await sessionRequest("logout")
  } catch {
    /* cookie tetap dihapus server bila request sampai */
  }
}
export async function getMe() {
  return apiRequest<User>("/me")
}

export async function getPermissions() {
  const data = await apiRequest<string[] | { permissions: string[] }>(
    "/me/permissions"
  )
  if (Array.isArray(data)) return data
  return data.permissions ?? []
}

export function hasPermission(
  permissions: string[],
  required?: string | string[]
): boolean {
  if (!required) return true
  const codes = Array.isArray(required) ? required : [required]
  return codes.some((code) => permissions.includes(code))
}
