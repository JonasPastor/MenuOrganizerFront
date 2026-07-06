"use client"

import { useEffect, useState, useMemo } from "react"
import { Flame, Droplets, Target, Apple, Pencil, Check, X, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Progress } from "@/components/ui/progress"

interface MetaResponse { id?: number; calorias: number; proteinas: number; carbohidratos: number; agua: number; }
interface Recipe { id: string; calories: number; proteinas: number; carbohidratos: number; }
type MealType = "breakfast" | "lunch" | "dinner" | "snack"
interface MealPlan { [day: string]: { [meal in MealType]?: string } }
interface RegistroAgua { id?: number; vasos: number; metaDiaria: number; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const mealTypes: { key: MealType }[] = [{ key: "breakfast" }, { key: "lunch" }, { key: "dinner" }, { key: "snack" }]
const defaults: MetaResponse = { calorias: 2000, proteinas: 120, carbohidratos: 280, agua: 8 }

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

export default function GoalsPage() {
  const [meta, setMeta] = useState<MetaResponse | null>(null)
  const [metaId, setMetaId] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<MetaResponse>(defaults)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [mealPlan, setMealPlan] = useState<MealPlan>({})
  const [registroAgua, setRegistroAgua] = useState<RegistroAgua>({ vasos: 0, metaDiaria: 8 })
  const [isSavingAgua, setIsSavingAgua] = useState(false)

  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const weekStartDate = useMemo(() => {
    const today = new Date()
    const offset = (today.getDay() + 6) % 7
    const monday = new Date(today)
    monday.setDate(today.getDate() - offset)
    return monday.toISOString().slice(0, 10)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("authUser")
    if (!stored) return
    try { const p = JSON.parse(stored) as { id?: string }; if (p?.id) setUserId(String(p.id)) } catch { }
  }, [])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true); setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/metaUsuario`, { headers: authHeaders() })
        if (!res.ok) { if (res.status === 404) { setMeta(null); return } throw new Error() }
        const data = (await res.json()) as Array<MetaResponse>
        if (data.length > 0) {
          const first = data[0]
          setMetaId(first.id ?? null)
          const loaded = { calorias: first.calorias ?? defaults.calorias, proteinas: first.proteinas ?? defaults.proteinas, carbohidratos: first.carbohidratos ?? defaults.carbohidratos, agua: first.agua ?? defaults.agua }
          setMeta(loaded); setDraft(loaded)
        }
      } catch { setError("Could not load your goals. Please try again.") }
      finally { setIsLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/menu`, { headers: authHeaders() })
        if (!res.ok) return
        const data = (await res.json()) as Array<{ id?: string; calorias?: number; proteinas?: number; carbohidratos?: number }>
        setRecipes(data.filter((i) => i?.id).map((i) => ({ id: i.id!, calories: Number(i.calorias) || 0, proteinas: Number(i.proteinas) || 0, carbohidratos: Number(i.carbohidratos) || 0 })))
      } catch { }
    }
    load()
  }, [])

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const planRes = await fetch(`${API_BASE_URL}/planSemanal/usuario/${userId}`, { headers: authHeaders() })
        if (!planRes.ok) return
        const plans = (await planRes.json()) as Array<{ id?: string; fechainiciosemana?: string }>
        const current = plans.find((p) => p.fechainiciosemana === weekStartDate)
        if (!current?.id) return
        const comidasRes = await fetch(`${API_BASE_URL}/planComida/planSemanal/${current.id}`, { headers: authHeaders() })
        if (!comidasRes.ok) return
        const comidas = (await comidasRes.json()) as Array<{ idmenu?: string; diasemana?: string; tipocomida?: string }>
        const plan: MealPlan = {}
        comidas.forEach((item) => {
          if (!item.diasemana || !item.tipocomida || !item.idmenu) return
          if (!plan[item.diasemana]) plan[item.diasemana] = {}
          plan[item.diasemana][item.tipocomida as MealType] = item.idmenu
        })
        setMealPlan(plan)
      } catch { }
    }
    load()
  }, [userId, weekStartDate])

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/registroAgua/usuario/${userId}/fecha/${todayDate}`, { headers: authHeaders() })
        if (!res.ok) return
        const data = (await res.json()) as { id?: number; vasos?: number; metaDiaria?: number }
        setRegistroAgua({ id: data.id, vasos: data.vasos ?? 0, metaDiaria: data.metaDiaria ?? 8 })
      } catch { }
    }
    load()
  }, [userId, todayDate])

  const weeklyProgress = useMemo(() => {
    const getRecipe = (id: string) => recipes.find((r) => r.id === id)
    return weekDays.reduce(
      (acc, day) => {
        mealTypes.forEach(({ key }) => { const id = mealPlan[day]?.[key]; if (!id) return; const r = getRecipe(id); if (!r) return; acc.calorias += r.calories; acc.proteinas += r.proteinas; acc.carbohidratos += r.carbohidratos; })
        return acc
      },
      { calorias: 0, proteinas: 0, carbohidratos: 0 }
    )
  }, [mealPlan, recipes])

  const handleWaterChange = async (delta: number) => {
    if (!userId) return
    const newVasos = Math.max(0, registroAgua.vasos + delta)
    setRegistroAgua((prev) => ({ ...prev, vasos: newVasos }))
    setIsSavingAgua(true)
    try { await fetch(`${API_BASE_URL}/registroAgua`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ idUsuario: userId, fecha: todayDate, vasos: newVasos }) }) } catch { } finally { setIsSavingAgua(false) }
  }

  const handleEdit = () => { setDraft(meta ?? defaults); setIsEditing(true); setSuccessMsg(null) }
  const handleCancel = () => { setIsEditing(false); setDraft(meta ?? defaults) }

  const handleSave = async () => {
    if (!userId) { setError("Missing user id"); return }
    setIsSaving(true); setError(null)
    try {
      if (meta && metaId) {
        const res = await fetch(`${API_BASE_URL}/metaUsuario/${metaId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ calorias: draft.calorias, proteinas: draft.proteinas, carbohidratos: draft.carbohidratos, agua: draft.agua }) })
        if (!res.ok) throw new Error()
        const updated = (await res.json()) as MetaResponse
        setMeta(updated); setDraft(updated)
      } else {
        const res = await fetch(`${API_BASE_URL}/metaUsuario`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ idUsuario: userId, calorias: draft.calorias, proteinas: draft.proteinas, carbohidratos: draft.carbohidratos, agua: draft.agua }) })
        if (!res.ok) throw new Error()
        const created = (await res.json()) as MetaResponse
        setMetaId(created.id ?? null); setMeta(created); setDraft(created)
      }
      setIsEditing(false)
      setSuccessMsg("Goals saved successfully!")
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch { setError("Could not save your goals. Please try again.") } finally { setIsSaving(false) }
  }

  const current = meta ?? defaults

  const goalFields = [
    { key: "calorias" as keyof MetaResponse, label: "Calories", unit: "kcal/day", icon: Flame, color: "bg-chart-1" },
    { key: "proteinas" as keyof MetaResponse, label: "Protein", unit: "g/day", icon: Target, color: "bg-chart-2" },
    { key: "carbohidratos" as keyof MetaResponse, label: "Carbohydrates", unit: "g/day", icon: Apple, color: "bg-chart-3" },
    { key: "agua" as keyof MetaResponse, label: "Water", unit: "glasses/day", icon: Droplets, color: "bg-chart-4" },
  ]

  const weeklyFields = [
    { label: "Calories", current: Math.round(weeklyProgress.calorias), target: current.calorias * 7, unit: "kcal", icon: Flame, color: "bg-chart-1" },
    { label: "Protein", current: Math.round(weeklyProgress.proteinas), target: current.proteinas * 7, unit: "g", icon: Target, color: "bg-chart-2" },
    { label: "Carbohydrates", current: Math.round(weeklyProgress.carbohidratos), target: current.carbohidratos * 7, unit: "g", icon: Apple, color: "bg-chart-3" },
  ]

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">Goals</h1>
            <p className="text-xs text-muted-foreground">Weekly nutrition targets</p>
          </div>
        </div>
        {!isEditing && (
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={handleEdit}>
            {meta ? <><Pencil className="size-3.5" /><span>Edit</span></> : <><Plus className="size-3.5" /><span>Set Goals</span></>}
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto max-w-2xl space-y-4">

          {error && <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
          {successMsg && <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-xs text-green-600">{successMsg}</div>}

          {isLoading && (
            <Card className="border-border">
              <CardContent className="flex items-center justify-center p-8">
                <p className="text-xs text-muted-foreground">Loading your goals...</p>
              </CardContent>
            </Card>
          )}

          {!isLoading && !meta && !isEditing && (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10"><Target className="size-6 text-primary" /></div>
                <div><p className="text-sm font-medium">No goals set yet</p><p className="text-xs text-muted-foreground">Set your weekly nutrition targets to track your progress.</p></div>
                <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={handleEdit}><Plus className="size-3.5" />Set Goals</Button>
              </CardContent>
            </Card>
          )}

          {/* Edit form */}
          {isEditing && (
            <Card className="border-primary/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
                <CardTitle className="text-sm font-semibold">{meta ? "Edit Goals" : "Set Your Goals"}</CardTitle>
                <Button variant="ghost" size="icon" className="size-7" onClick={handleCancel} disabled={isSaving}><X className="size-4" /></Button>
              </CardHeader>
              <CardContent className="space-y-4 p-3 pt-0">
                {goalFields.map(({ key, label, unit, icon: Icon, color }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <div className={`flex size-5 items-center justify-center rounded ${color}`}><Icon className="size-3 text-primary-foreground" /></div>
                      {label} <span className="text-muted-foreground">({unit})</span>
                    </Label>
                    <Input type="number" value={draft[key]} onChange={(e) => setDraft((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))} className="h-10" min={0} />
                  </div>
                ))}
                <Button className="h-10 w-full gap-2" onClick={handleSave} disabled={isSaving}>
                  <Check className="size-4" />{isSaving ? "Saving..." : "Save Goals"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Weekly progress */}
          {!isLoading && !isEditing && (
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Weekly Progress</p>

              {weeklyFields.map(({ label, current: c, target, unit, icon: Icon, color }) => {
                const pct = target > 0 ? Math.min((c / target) * 100, 100) : 0
                return (
                  <Card key={label} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="size-5 text-primary-foreground" /></div>
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-[10px] text-muted-foreground">Weekly target: {target} {unit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold leading-tight">{c}</p>
                          <p className="text-[10px] text-muted-foreground">{unit} this week</p>
                        </div>
                      </div>
                      <Progress value={pct} className="mt-3 h-1.5" />
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">{Math.round(pct)}% of weekly goal</p>
                        <p className="text-[10px] text-muted-foreground">{Math.max(0, target - c)} {unit} remaining</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Water daily */}
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Today's Water</p>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-chart-4"><Droplets className="size-5 text-primary-foreground" /></div>
                      <div>
                        <p className="text-sm font-semibold">Water</p>
                        <p className="text-[10px] text-muted-foreground">Daily target: {registroAgua.metaDiaria} glasses</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold leading-tight">{registroAgua.vasos}</p>
                      <p className="text-[10px] text-muted-foreground">glasses today</p>
                    </div>
                  </div>
                  <Progress value={Math.min((registroAgua.vasos / registroAgua.metaDiaria) * 100, 100)} className="mb-3 h-1.5" />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="size-8" onClick={() => handleWaterChange(-1)} disabled={registroAgua.vasos <= 0 || isSavingAgua}><Minus className="size-3" /></Button>
                    <div className="flex flex-1 gap-1">
                      {Array.from({ length: registroAgua.metaDiaria }).map((_, i) => (
                        <div key={i} className={`h-5 flex-1 rounded transition-colors ${i < registroAgua.vasos ? "bg-chart-4" : "bg-secondary"}`} />
                      ))}
                    </div>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => handleWaterChange(1)} disabled={registroAgua.vasos >= registroAgua.metaDiaria || isSavingAgua}><Plus className="size-3" /></Button>
                  </div>
                  {isSavingAgua && <p className="mt-1 text-center text-[10px] text-muted-foreground">Saving...</p>}
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </main>
  )
}