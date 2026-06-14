"use client"

import { useEffect, useState } from "react"
import {
  Flame,
  Droplets,
  Target,
  Apple,
  Pencil,
  Check,
  X,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Progress } from "@/components/ui/progress"

// ── Types ──────────────────────────────────────────────────────────────────

interface MetaResponse {
  calorias: number
  proteinas: number
  carbohidratos: number
  agua: number
}

interface GoalField {
  key: keyof MetaResponse
  label: string
  unit: string
  icon: React.ElementType
  color: string
  description: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"

const goalFields: GoalField[] = [
  {
    key: "calorias",
    label: "Calories",
    unit: "kcal",
    icon: Flame,
    color: "bg-chart-1",
    description: "Daily calorie target",
  },
  {
    key: "proteinas",
    label: "Protein",
    unit: "g",
    icon: Target,
    color: "bg-chart-2",
    description: "Daily protein target",
  },
  {
    key: "carbohidratos",
    label: "Carbohydrates",
    unit: "g",
    icon: Apple,
    color: "bg-chart-3",
    description: "Daily carbohydrate target",
  },
  {
    key: "agua",
    label: "Water",
    unit: "glasses",
    icon: Droplets,
    color: "bg-chart-4",
    description: "Daily water intake goal",
  },
]

const defaults: MetaResponse = {
  calorias: 2000,
  proteinas: 120,
  carbohidratos: 280,
  agua: 8,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  const [metaId, setMetaId] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<MetaResponse>(defaults)

  // ── Load user + meta ────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem("authUser")
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as { id?: string }
      if (parsed?.id) setUserId(String(parsed.id))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/metaUsuario`, { headers: authHeaders() })
        if (!res.ok) {
          if (res.status === 404) {
            setMeta(null)
            return
          }
          throw new Error("Failed to load goals")
        }

        // Backend returns a list — get the one for this user
        const data = (await res.json()) as Array<{
          id?: number
          calorias?: number
          proteinas?: number
          carbohidratos?: number
          agua?: number
        }>

        if (data.length > 0) {
          const first = data[0]
          setMetaId(first.id ?? null)
          const loaded: MetaResponse = {
            calorias: first.calorias ?? defaults.calorias,
            proteinas: first.proteinas ?? defaults.proteinas,
            carbohidratos: first.carbohidratos ?? defaults.carbohidratos,
            agua: first.agua ?? defaults.agua,
          }
          setMeta(loaded)
          setDraft(loaded)
        }
      } catch {
        setError("Could not load your goals. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleEdit = () => {
    setDraft(meta ?? defaults)
    setIsEditing(true)
    setSuccessMsg(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setDraft(meta ?? defaults)
  }

  const handleSave = async () => {
    if (!userId) { setError("Missing user id"); return }
    setIsSaving(true)
    setError(null)

    try {
      if (meta && metaId) {
        // Update existing
        const res = await fetch(`${API_BASE_URL}/metaUsuario/${metaId}`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            calorias: draft.calorias,
            proteinas: draft.proteinas,
            carbohidratos: draft.carbohidratos,
            agua: draft.agua,
          }),
        })
        if (!res.ok) throw new Error("Failed to update goals")
        const updated = (await res.json()) as MetaResponse
        setMeta(updated)
        setDraft(updated)
      } else {
        // Create new
        const res = await fetch(`${API_BASE_URL}/metaUsuario`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            idUsuario: userId,
            calorias: draft.calorias,
            proteinas: draft.proteinas,
            carbohidratos: draft.carbohidratos,
            agua: draft.agua,
          }),
        })
        if (!res.ok) throw new Error("Failed to create goals")
        const created = (await res.json()) as MetaResponse & { id?: number }
        setMetaId(created.id ?? null)
        setMeta(created)
        setDraft(created)
      }

      setIsEditing(false)
      setSuccessMsg("Goals saved successfully!")
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch {
      setError("Could not save your goals. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDraftChange = (key: keyof MetaResponse, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: Number(value) || 0 }))
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const current = meta ?? defaults

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">Goals</h1>
            <p className="text-xs text-muted-foreground">Your daily nutrition targets</p>
          </div>
        </div>
        {!isEditing && (
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={handleEdit}>
            {meta ? (
              <>
                <Pencil className="size-3.5" />
                <span>Edit</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                <span>Set Goals</span>
              </>
            )}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto max-w-2xl space-y-4">

          {/* Feedback messages */}
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-xs text-green-600">
              {successMsg}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <Card className="border-border">
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-xs text-muted-foreground">Loading your goals...</p>
              </CardContent>
            </Card>
          )}

          {/* No goals yet */}
          {!isLoading && !meta && !isEditing && (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">No goals set yet</p>
                  <p className="text-xs text-muted-foreground">
                    Set your daily nutrition targets to start tracking your progress.
                  </p>
                </div>
                <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={handleEdit}>
                  <Plus className="size-3.5" />
                  Set Goals
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit form */}
          {isEditing && (
            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                <CardTitle className="text-sm font-semibold">
                  {meta ? "Edit Goals" : "Set Your Goals"}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="size-7" onClick={handleCancel} disabled={isSaving}>
                    <X className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-3 pt-0">
                {goalFields.map(({ key, label, unit, icon: Icon, color }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <div className={`flex size-5 items-center justify-center rounded ${color}`}>
                        <Icon className="size-3 text-primary-foreground" />
                      </div>
                      {label}
                      <span className="text-muted-foreground">({unit})</span>
                    </Label>
                    <Input
                      type="number"
                      value={draft[key]}
                      onChange={(e) => handleDraftChange(key, e.target.value)}
                      className="h-10"
                      min={0}
                    />
                  </div>
                ))}

                <Button className="h-10 w-full gap-2" onClick={handleSave} disabled={isSaving}>
                  <Check className="size-4" />
                  {isSaving ? "Saving..." : "Save Goals"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Goals display */}
          {!isLoading && !isEditing && (
            <div className="space-y-3">
              {goalFields.map(({ key, label, unit, icon: Icon, color, description }) => {
                const value = current[key]
                // Simple visual progress based on typical max values
                const maxMap: Record<keyof MetaResponse, number> = {
                  calorias: 4000,
                  proteinas: 250,
                  carbohidratos: 500,
                  agua: 16,
                }
                const progress = Math.min((Number(value) / maxMap[key]) * 100, 100)

                return (
                  <Card key={key} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
                            <Icon className="size-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-[10px] text-muted-foreground">{description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold leading-tight">{value}</p>
                          <p className="text-[10px] text-muted-foreground">{unit} / day</p>
                        </div>
                      </div>
                      <Progress value={progress} className="mt-3 h-1.5" />
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        {Math.round(progress)}% of typical max
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </main>
  )
}