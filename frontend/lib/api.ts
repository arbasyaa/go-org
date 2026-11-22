import type { ApiEnvelope } from "@/lib/types"
import { normalizeApiData } from "@/lib/format"

/**
 * Browser: SELALU same-origin proxy `/api/backend` — sesi adalah cookie HttpOnly
 * `token` milik origin Next; proxy.ts menyuntik `Authorization` dari cookie itu.
 * NEXT_PUBLIC_USE_DIRECT_API=1 tidak lagi berlaku untuk panggilan API (browser
 * tak bisa membawa cookie HttpOnly origin Next ke host backend); hanya
 * lib/storage-url.ts yang masih memakainya. Server: panggil backend langsung.
 */
function resolveApiBase() {
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://127.0.0.1:8080"
    )
  }
  const pub = process.env.NEXT_PUBLIC_API_URL
  if (pub && pub.startsWith("/")) return pub
  return "/api/backend"
}

const API_BASE = resolveApiBase()

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, params?: RequestOptions["params"]) {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const base = API_BASE.replace(/\/$/, "")
  const full =
    path.startsWith("http")
      ? path
      : base.startsWith("http")
        ? `${base}${normalized}`
        : `${base}${normalized}`

  // Relative base (proxy): keep relative for fetch; Absolute: use URL for params.
  if (full.startsWith("http")) {
    const url = new URL(full)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value))
        }
      }
    }
    return url.toString()
  }

  const qs = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        qs.set(key, String(value))
      }
    }
  }
  const q = qs.toString()
  return q ? `${full}?${q}` : full
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers, ...rest } = options
  const isFormData = body instanceof FormData

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: isFormData
      ? (body as FormData)
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  })

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(
      response.statusText || "Request failed",
      response.status
    )
  }

  if (!response.ok || envelope.success === false) {
    throw new ApiError(
      envelope.message || "Request failed",
      response.status,
      envelope.errors
    )
  }

  return normalizeApiData(envelope.data) as T
}

export function getApiBase() {
  return API_BASE
}
