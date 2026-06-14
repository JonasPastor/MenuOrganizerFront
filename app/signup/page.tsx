"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  Eye,
  EyeOff,
  Leaf,
  Mail,
  Ruler,
  Scale,
  User,
  UserCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL ?? "http://localhost:8080/api/v1/auth"

type RegisterForm = {
  nombre: string
  apellido: string
  username: string
  email: string
  password: string
  nacimiento: string
  sexo: string
  altura: string
  peso: string
}

const initialForm: RegisterForm = {
  nombre: "",
  apellido: "",
  username: "",
  email: "",
  password: "",
  nacimiento: "",
  sexo: "",
  altura: "",
  peso: "",
}

export default function SignupPage() {
  const [form, setForm] = useState<RegisterForm>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${AUTH_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: form.password,
          email: form.email,
          username: form.username,
          nacimiento: form.nacimiento,
          sexo: form.sexo,
          altura: form.altura ? Number(form.altura) : null,
          peso: form.peso ? Number(form.peso) : null,
          nombre: form.nombre,
          apellido: form.apellido,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Register failed")
      }

      const data = await response.json().catch(() => ({}))
      const jwt = data?.jwt ?? data?.token ?? data?.accessToken
      if (jwt) {
        localStorage.setItem("authToken", jwt)
      }

      const userId = data?.idusuario ?? data?.idUsuario ?? data?.id ?? null
      localStorage.setItem(
        "authUser",
        JSON.stringify({
          id: userId,
          nombre: data?.nombre ?? form.nombre,
          apellido: data?.apellido ?? form.apellido,
          email: data?.email ?? form.email,
          nacimiento: data?.nacimiento ?? form.nacimiento ?? null,
        })
      )

      router.push("/")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Register failed"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.08),_transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-3xl">
        <div className="flex flex-col gap-6">
          <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-6 rounded-2xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
                <Leaf className="size-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">MenuOrganizer</p>
                <h1 className="text-2xl font-semibold">Create your account</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Set up your nutrition profile to personalize meal plans and goals.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { title: "Personal profile", detail: "Name, sexo, nacimiento" },
                { title: "Body metrics", detail: "Altura and peso" },
                { title: "Access", detail: "Email, username, password" },
                { title: "Secure", detail: "Your data stays private" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border/60 bg-background/40 p-3">
                  <p className="text-xs font-semibold">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="mx-auto w-full max-w-2xl border-border bg-card/90 backdrop-blur">
            <CardHeader className="space-y-1 p-6 pb-4">
              <CardTitle className="text-xl font-semibold">Sign up</CardTitle>
              <CardDescription className="text-sm">
                Complete the fields to create your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre" className="text-xs font-medium">
                      Nombre
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        placeholder="Jane"
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido" className="text-xs font-medium">
                      Apellido
                    </Label>
                    <div className="relative">
                      <UserCircle2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="apellido"
                        name="apellido"
                        value={form.apellido}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs font-medium">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="jane_doe"
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className="h-11 pr-10 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground active:opacity-70"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nacimiento" className="text-xs font-medium">
                      Nacimiento
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="nacimiento"
                        name="nacimiento"
                        type="date"
                        value={form.nacimiento}
                        onChange={handleChange}
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sexo" className="text-xs font-medium">
                      Sexo
                    </Label>
                    <select
                      id="sexo"
                      name="sexo"
                      value={form.sexo}
                      onChange={handleChange}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                      required
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="F">F</option>
                      <option value="M">M</option>
                      <option value="X">X</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="altura" className="text-xs font-medium">
                      Altura (cm)
                    </Label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="altura"
                        name="altura"
                        type="number"
                        inputMode="decimal"
                        value={form.altura}
                        onChange={handleChange}
                        placeholder="170"
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="peso" className="text-xs font-medium">
                      Peso (kg)
                    </Label>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="peso"
                        name="peso"
                        type="number"
                        inputMode="decimal"
                        value={form.peso}
                        onChange={handleChange}
                        placeholder="65"
                        className="h-11 pl-10 text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="h-11 w-full text-sm font-medium" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline active:opacity-70">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
