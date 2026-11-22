"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { login } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

/** Hanya path internal; tolak URL absolut / protocol-relative (open redirect). */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard"
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(username, password)
      const next = safeNext(searchParams.get("next"))
      // Full navigation so middleware sees the `token` cookie set on this origin.
      window.location.assign(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login gagal")
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-6 py-2">
        <form
          className={cn("flex flex-col gap-6", className)}
          onSubmit={handleSubmit}
          {...props}
        >
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Masuk ke Portal Pengurus
            </h1>
            <p className="text-sm text-balance text-muted-foreground">
              Gunakan username dan password akun organisasi Anda.
            </p>
          </div>

          <FieldGroup>
            {error ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="budi.santoso"
                required
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={loading}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  aria-pressed={showPassword}
                  aria-controls="password"
                  className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </Button>
              </div>
            </Field>
            <Field>
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                aria-busy={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </Field>
          </FieldGroup>

          {/* Sengaja bukan tautan: pendaftaran hanya lewat Sekretaris Wilayah,
              dan alamat halaman daftarnya tidak dipublikasikan. */}
          <p className="text-center text-sm text-muted-foreground">
            Belum punya akun? Hubungi Sekretaris Wilayah
          </p>
        </form>
      </CardContent>
      <div className="flex justify-center">
        <Button
          variant="link"
          size="sm"
          render={<Link href="/" />}
          className="text-muted-foreground"
        >
          <ArrowLeftIcon />
          Kembali ke beranda
        </Button>
      </div>
    </Card>
  )
}
