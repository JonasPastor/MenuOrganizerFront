"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Flame,
  Plus,
  Target,
  Droplets,
  Apple,
  Package,
  Minus,
  AlertTriangle,
  X,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

// ── Types ──────────────────────────────────────────────────────────────────

interface IngredientStock {
  id: number;
  nombre: string;
  unidad: string;
  cantidadDisponible: number;
  stockMinimo: number;
}

interface Recipe {
  id: string;
  name: string;
  calories: number;
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealPlan {
  [day: string]: { [meal in MealType]?: string };
}

interface MealPlanIds {
  [day: string]: { [meal in MealType]?: number };
}

// ── Constants ──────────────────────────────────────────────────────────────

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const mealTypes: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

const nutritionStats = [
  {
    label: "Calories",
    current: 1850,
    target: 2200,
    unit: "kcal",
    icon: Flame,
    color: "bg-chart-1",
  },
  {
    label: "Protein",
    current: 95,
    target: 120,
    unit: "g",
    icon: Target,
    color: "bg-chart-2",
  },
  {
    label: "Carbs",
    current: 220,
    target: 280,
    unit: "g",
    icon: Apple,
    color: "bg-chart-3",
  },
  {
    label: "Water",
    current: 6,
    target: 8,
    unit: "glasses",
    icon: Droplets,
    color: "bg-chart-4",
  },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

const emptyMealPlan: MealPlan = {
  Mon: {},
  Tue: {},
  Wed: {},
  Thu: {},
  Fri: {},
  Sat: {},
  Sun: {},
};
const emptyMealPlanIds: MealPlanIds = {
  Mon: {},
  Tue: {},
  Wed: {},
  Thu: {},
  Fri: {},
  Sat: {},
  Sun: {},
};

// ── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [displayName, setDisplayName] = useState("there");
  const [userId, setUserId] = useState<string | null>(null);

  // Meal planner state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>(emptyMealPlan);
  const [mealPlanIds, setMealPlanIds] = useState<MealPlanIds>(emptyMealPlanIds);
  const [planSemanalId, setPlanSemanalId] = useState<string | null>(null);
  const [selectingMeal, setSelectingMeal] = useState<{
    day: string;
    meal: MealType;
  } | null>(null);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [mealError, setMealError] = useState<string | null>(null);

  // Stock state
  const [stock, setStock] = useState<IngredientStock[]>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // ── Week calculation ─────────────────────────────────────────────────────

  const weekStartDate = useMemo(() => {
    const today = new Date();
    const offset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    return monday.toISOString().slice(0, 10);
  }, []);

  const currentWeek = useMemo(() => {
    const start = new Date(weekStartDate + "T00:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(start)} - ${fmt(end)}`;
  }, [weekStartDate]);

  const weekStartDay = useMemo(
    () => new Date(weekStartDate + "T00:00:00").getDate(),
    [weekStartDate],
  );

  // ── Load user ────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { nombre?: string; id?: string };
      if (parsed?.nombre) setDisplayName(parsed.nombre);
      if (parsed?.id) setUserId(String(parsed.id));
    } catch {
      // ignore
    }
  }, []);

  // ── Load menus (recipes) ─────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/menu`, {
          headers: authHeaders(),
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          id?: string;
          nombre?: string;
          calorias?: number | string;
        }>;
        setRecipes(
          data
            .filter((i) => i?.id && i?.nombre)
            .map((i) => ({
              id: i.id!,
              name: i.nombre!,
              calories: Number(i.calorias) || 0,
            })),
        );
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // ── Load meal plan ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      setMealError(null);
      try {
        // 1. Get plans for this user
        const planRes = await fetch(
          `${API_BASE_URL}/planSemanal/usuario/${userId}`,
          {
            headers: authHeaders(),
          },
        );

        if (!planRes.ok) {
          setPlanSemanalId(null);
          setMealPlan(emptyMealPlan);
          setMealPlanIds(emptyMealPlanIds);
          return;
        }

        const plans = (await planRes.json()) as Array<{
          id?: string;
          fechainiciosemana?: string;
        }>;
        const current = plans.find(
          (p) => p.fechainiciosemana === weekStartDate,
        );

        if (!current?.id) {
          setPlanSemanalId(null);
          setMealPlan(emptyMealPlan);
          setMealPlanIds(emptyMealPlanIds);
          return;
        }

        setPlanSemanalId(current.id);

        // 2. Get meals for this plan
        const comidasRes = await fetch(
          `${API_BASE_URL}/planComida/planSemanal/${current.id}`,
          {
            headers: authHeaders(),
          },
        );

        if (!comidasRes.ok) {
          setMealPlan(emptyMealPlan);
          setMealPlanIds(emptyMealPlanIds);
          return;
        }

        const comidas = (await comidasRes.json()) as Array<{
          id?: number;
          idmenu?: string;
          diasemana?: string;
          tipocomida?: string;
        }>;

        const nextPlan: MealPlan = {
          Mon: {},
          Tue: {},
          Wed: {},
          Thu: {},
          Fri: {},
          Sat: {},
          Sun: {},
        };
        const nextIds: MealPlanIds = {
          Mon: {},
          Tue: {},
          Wed: {},
          Thu: {},
          Fri: {},
          Sat: {},
          Sun: {},
        };

        comidas.forEach((item) => {
          const day = item.diasemana;
          const meal = item.tipocomida as MealType | undefined;
          if (!day || !meal || !nextPlan[day]) return;
          if (item.idmenu) nextPlan[day][meal] = item.idmenu;
          if (item.id !== undefined) nextIds[day][meal] = item.id;
        });

        setMealPlan(nextPlan);
        setMealPlanIds(nextIds);
      } catch {
        setMealError("Failed to load meal plan");
      }
    };

    load();
  }, [userId, weekStartDate]);

  // ── Load stock ───────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      setIsLoadingStock(true);
      setStockError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/stock`, {
          headers: authHeaders(),
        });
        if (!res.ok) {
          if (res.status === 404) {
            setStock([]);
            return;
          }
          throw new Error("Failed to load stock");
        }
        const data = (await res.json()) as Array<{
          id?: number;
          ingrediente?: string;
          cantidadDisponible?: number;
          stockMinimo?: number;
          unidad?: string;
        }>;
        setStock(
          data.map((item, i) => ({
            id: item.id ?? i,
            nombre: item.ingrediente ?? "",
            unidad: item.unidad ?? "",
            cantidadDisponible: item.cantidadDisponible ?? 0,
            stockMinimo: item.stockMinimo ?? 0,
          })),
        );
      } catch {
        setStockError("Failed to load stock");
      } finally {
        setIsLoadingStock(false);
      }
    };
    load();
  }, []);

  // ── Meal planner handlers ────────────────────────────────────────────────

  const getRecipeById = (id: string) => recipes.find((r) => r.id === id);

  const getDayTotalCalories = (day: string) =>
    mealTypes.reduce((total, { key }) => {
      const id = mealPlan[day]?.[key];
      return total + (id ? (getRecipeById(id)?.calories ?? 0) : 0);
    }, 0);

  const handleSelectRecipe = async (recipeId: string | null) => {
    if (!selectingMeal) return;
    setIsSavingMeal(true);
    setMealError(null);

    try {
      const existingId = mealPlanIds[selectingMeal.day]?.[selectingMeal.meal];

      // Clear meal
      if (!recipeId) {
        if (existingId) {
          await fetch(`${API_BASE_URL}/planComida/${existingId}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
        }
        setMealPlan((prev) => ({
          ...prev,
          [selectingMeal.day]: {
            ...prev[selectingMeal.day],
            [selectingMeal.meal]: undefined,
          },
        }));
        setMealPlanIds((prev) => ({
          ...prev,
          [selectingMeal.day]: {
            ...prev[selectingMeal.day],
            [selectingMeal.meal]: undefined,
          },
        }));
        setSelectingMeal(null);
        return;
      }

      // Create plan semanal if needed
      let planId = planSemanalId;
      if (!planId) {
        if (!userId) throw new Error("Missing user id");
        const planRes = await fetch(`${API_BASE_URL}/planSemanal`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            idusuario: userId,
            fechainiciosemana: weekStartDate,
          }),
        });
        if (!planRes.ok) throw new Error("Failed to create weekly plan");
        const planData = (await planRes.json()) as { id?: string };
        if (!planData.id) throw new Error("Plan created without id");
        planId = planData.id;
        setPlanSemanalId(planId);
      }

      // Create or update plan comida
      const method = existingId ? "PUT" : "POST";
      const endpoint = existingId
        ? `${API_BASE_URL}/planComida/${existingId}`
        : `${API_BASE_URL}/planComida`;

      const res = await fetch(endpoint, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          idplansemanal: planId,
          diasemana: selectingMeal.day,
          idmenu: recipeId,
          tipocomida: selectingMeal.meal,
        }),
      });
      if (!res.ok) throw new Error("Failed to save meal");
      const data = (await res.json().catch(() => ({}))) as { id?: number };

      setMealPlan((prev) => ({
        ...prev,
        [selectingMeal.day]: {
          ...prev[selectingMeal.day],
          [selectingMeal.meal]: recipeId,
        },
      }));
      setMealPlanIds((prev) => ({
        ...prev,
        [selectingMeal.day]: {
          ...prev[selectingMeal.day],
          [selectingMeal.meal]: data.id ?? existingId,
        },
      }));
      setSelectingMeal(null);
    } catch (err) {
      setMealError(err instanceof Error ? err.message : "Failed to save meal");
    } finally {
      setIsSavingMeal(false);
    }
  };

  // ── Stock handlers ───────────────────────────────────────────────────────

  const lowStockItems = stock.filter(
    (item) => item.cantidadDisponible <= item.stockMinimo,
  );

  const [pendingStock, setPendingStock] = useState<Record<number, number>>({});
  const [savingStock, setSavingStock] = useState<number | null>(null);

  const handleChangeQty = (item: IngredientStock, delta: number) => {
    const current = pendingStock[item.id] ?? item.cantidadDisponible;
    setPendingStock((prev) => ({
      ...prev,
      [item.id]: Math.max(0, current + delta),
    }));
  };

  const handleSetQuantity = (item: IngredientStock) => {
    const value = parseFloat(editValue);
    if (!isNaN(value) && value >= 0) {
      setPendingStock((prev) => ({ ...prev, [item.id]: value }));
    }
    setEditingStock(null);
    setEditValue("");
  };

  const handleSaveStock = async (item: IngredientStock) => {
    const newQty = pendingStock[item.id];
    if (newQty === undefined) return;

    setSavingStock(item.id);
    try {
      const res = await fetch(`${API_BASE_URL}/stock/${item.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          idIngrediente: item.id,
          cantidaddisponible: newQty,
          stockMinimo: item.stockMinimo,
        }),
      });
      if (!res.ok) throw new Error("Failed to update stock");

      setStock((prev) =>
        prev.map((s) =>
          s.id === item.id ? { ...s, cantidadDisponible: newQty } : s,
        ),
      );
      setPendingStock((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch {
      setStockError("Failed to save stock");
    } finally {
      setSavingStock(null);
    }
  };

  const startEditing = (item: IngredientStock) => {
    setEditingStock(item.id);
    setEditValue(item.cantidadDisponible.toString());
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">
              Good morning, {displayName}!
            </h1>
            <p className="text-xs text-muted-foreground">
              Track your nutrition
            </p>
          </div>
        </div>
        <Button size="sm" className="h-8 gap-1.5 px-3 text-xs">
          <Plus className="size-3.5" />
          <span className="hidden xs:inline">Log</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            {nutritionStats.map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="text-lg font-bold leading-tight">
                        {stat.current}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /{stat.target}
                        </span>
                      </p>
                    </div>
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${stat.color}`}
                    >
                      <stat.icon className="size-4 text-primary-foreground" />
                    </div>
                  </div>
                  <Progress
                    value={(stat.current / stat.target) * 100}
                    className="mt-2 h-1.5"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Meal Planner */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <CardTitle className="text-sm font-semibold">
                Meal Planner
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-6">
                  <ChevronLeft className="size-3" />
                </Button>
                <span className="text-[10px] font-medium">{currentWeek}</span>
                <Button variant="ghost" size="icon" className="size-6">
                  <ChevronRight className="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {mealError && (
                <div className="mb-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {mealError}
                </div>
              )}

              {/* Day selector */}
              <div className="-mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none">
                {weekDays.map((day, i) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`flex min-w-[44px] flex-col items-center rounded-lg px-2 py-1.5 transition-colors ${
                      selectedDay === day
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary active:bg-accent"
                    }`}
                  >
                    <span className="text-[10px] font-medium">{day}</span>
                    <span className="text-sm font-bold">
                      {weekStartDay + i}
                    </span>
                  </button>
                ))}
              </div>

              {/* Daily total */}
              <div className="mb-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                <span className="text-xs font-medium">Daily Total</span>
                <span className="text-sm font-bold text-primary">
                  {getDayTotalCalories(selectedDay)} kcal
                </span>
              </div>

              {/* Meal cards */}
              <div className="grid grid-cols-2 gap-2">
                {mealTypes.map(({ key, label }) => {
                  const recipeId = mealPlan[selectedDay]?.[key];
                  const recipe = recipeId ? getRecipeById(recipeId) : null;
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setSelectingMeal({ day: selectedDay, meal: key })
                      }
                      className="rounded-lg border border-border bg-secondary/50 p-2.5 text-left transition-colors active:bg-secondary"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {label}
                      </span>
                      {recipe ? (
                        <>
                          <p className="mt-0.5 truncate text-xs font-medium">
                            {recipe.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {recipe.calories} kcal
                          </p>
                        </>
                      ) : (
                        <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                          <Plus className="size-3" />
                          <span className="text-[10px]">Add recipe</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ingredient Stock */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Ingredient Stock
                </CardTitle>
              </div>
              {lowStockItems.length > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5">
                  <AlertTriangle className="size-3 text-destructive" />
                  <span className="text-[10px] font-medium text-destructive">
                    {lowStockItems.length} low
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {isLoadingStock && (
                <p className="text-xs text-muted-foreground">
                  Loading stock...
                </p>
              )}
              {stockError && (
                <p className="text-xs text-destructive">{stockError}</p>
              )}
              {!isLoadingStock && !stockError && stock.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No stock registered yet.
                </p>
              )}
              <div className="space-y-2">
                {stock.map((item) => {
                  const displayQty =
                    pendingStock[item.id] ?? item.cantidadDisponible;
                  const isLow = displayQty <= item.stockMinimo;
                  const isEditing = editingStock === item.id;
                  const isDirty = pendingStock[item.id] !== undefined;
                  const isSaving = savingStock === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 ${
                        isLow
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium">
                            {item.nombre}
                          </span>
                          {isLow && (
                            <AlertTriangle className="size-3 shrink-0 text-destructive" />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Min: {item.stockMinimo} {item.unidad}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleChangeQty(item, -10)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSetQuantity(item)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSetQuantity(item);
                              if (e.key === "Escape") {
                                setEditingStock(null);
                                setEditValue("");
                              }
                            }}
                            className="h-7 w-16 text-center text-xs"
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => startEditing(item)}
                            className="flex h-7 w-16 items-center justify-center rounded-md bg-background text-xs font-medium active:bg-accent"
                          >
                            {displayQty}
                            <span className="ml-0.5 text-muted-foreground">
                              {item.unidad}
                            </span>
                          </button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleChangeQty(item, 10)}
                        >
                          <Plus className="size-3" />
                        </Button>
                        {isDirty && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleSaveStock(item)}
                            disabled={isSaving}
                          >
                            {isSaving ? "..." : "Save"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-semibold">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-2.5">
                {[
                  {
                    time: "8:30 AM",
                    action: "Logged breakfast",
                    detail: "Greek Yogurt - 350 kcal",
                  },
                  {
                    time: "10:15 AM",
                    action: "Water intake",
                    detail: "2 glasses added",
                  },
                  {
                    time: "12:45 PM",
                    action: "Logged lunch",
                    detail: "Quinoa Salad - 520 kcal",
                  },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {activity.action}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Goals */}
          <Card className="border-border">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-semibold">
                Weekly Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-3">
                {[
                  { label: "Calorie target", progress: 85, status: "On track" },
                  {
                    label: "5 veggie servings",
                    progress: 60,
                    status: "3/5 days",
                  },
                  {
                    label: "8 glasses water",
                    progress: 70,
                    status: "5/7 days",
                  },
                ].map((goal, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{goal.label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {goal.status}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recipe selector modal */}
      {selectingMeal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <Card className="w-full max-w-md max-h-[70vh] overflow-hidden border-border animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border p-3">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Select Recipe
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">
                  {selectingMeal.day} -{" "}
                  {mealTypes.find((m) => m.key === selectingMeal.meal)?.label}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setSelectingMeal(null)}
                disabled={isSavingMeal}
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0 max-h-[50vh]">
              {isSavingMeal && (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  Saving...
                </div>
              )}
              <button
                onClick={() => handleSelectRecipe(null)}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left active:bg-secondary"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <X className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No meal</p>
                  <p className="text-[10px] text-muted-foreground">
                    Clear this slot
                  </p>
                </div>
              </button>
              {recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe.id)}
                  className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 active:bg-secondary"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <UtensilsCrossed className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {recipe.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {recipe.calories} kcal
                    </p>
                  </div>
                  {mealPlan[selectingMeal.day]?.[selectingMeal.meal] ===
                    recipe.id && (
                    <div className="size-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
