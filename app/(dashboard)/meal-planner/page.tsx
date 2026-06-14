"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface Recipe {
  id: string;
  name: string;
  calories: number;
}

type MealType = "breakfast" | "lunch" | "snack" | "dinner";

interface MealPlan {
  [day: string]: {
    [meal in MealType]?: string;
  };
}

interface MealPlanIds {
  [day: string]: {
    [meal in MealType]?: number;
  };
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const mealTypes: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "snack", label: "Snack" },
  { key: "dinner", label: "Dinner" },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

const initialMealPlan: MealPlan = {
  Mon: {},
  Tue: {},
  Wed: {},
  Thu: {},
  Fri: {},
  Sat: {},
  Sun: {},
};

const initialMealPlanIds: MealPlanIds = {
  Mon: {},
  Tue: {},
  Wed: {},
  Thu: {},
  Fri: {},
  Sat: {},
  Sun: {},
};

export default function MealPlannerPage() {
  const [selectedDay, setSelectedDay] = useState("Mon");
  const [mealPlan, setMealPlan] = useState<MealPlan>(initialMealPlan);
  const [mealPlanIds, setMealPlanIds] =
    useState<MealPlanIds>(initialMealPlanIds);
  const [selectingMeal, setSelectingMeal] = useState<{
    day: string;
    meal: MealType;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planSemanalId, setPlanSemanalId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const weekStartDate = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const offset = (day + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - offset);
    return monday.toISOString().slice(0, 10);
  }, []);

  const currentWeek = useMemo(() => {
    const start = new Date(weekStartDate + "T00:00:00");
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const format = (date: Date) =>
      date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${format(start)} - ${format(end)}`;
  }, [weekStartDate]);

  useEffect(() => {
    const loadMenus = async () => {
      setIsLoadingRecipes(true);
      setRecipesError(null);

      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_BASE_URL}/menu`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Failed to load menus");
        }

        const data = (await response.json()) as Array<{
          id?: string;
          nombre?: string;
          calorias?: number | string;
        }>;

        const normalized = data
          .filter((item) => item?.id && item?.nombre)
          .map((item, index) => ({
            id: item.id ?? `${index}`,
            name: item.nombre ?? "",
            calories: Number(item.calorias) || 0,
          }));

        setRecipes(normalized);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load menus";
        setRecipesError(message);
      } finally {
        setIsLoadingRecipes(false);
      }
    };

    loadMenus();
  }, []);

  useEffect(() => {
    console.log("weekStartDate:", weekStartDate);
  }, [weekStartDate]);

  useEffect(() => {
    const loadPlan = async () => {
      setRecipesError(null);

      try {
        const stored = localStorage.getItem("authUser");
        const parsed = stored
          ? (JSON.parse(stored) as { id?: string | null })
          : null;
        const currentUserId = parsed?.id ? String(parsed.id) : null;
        if (!currentUserId) {
          throw new Error("Missing user id");
        }

        setUserId(currentUserId);

        const token = localStorage.getItem("authToken");
        const planResponse = await fetch(
          `${API_BASE_URL}/planSemanal/usuario/${currentUserId}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        if (!planResponse.ok) {
          if (planResponse.status === 404) {
            setPlanSemanalId(null);
            setMealPlan(initialMealPlan);
            setMealPlanIds(initialMealPlanIds);
            return;
          }
          const text = await planResponse.text();
          throw new Error(text || "Failed to load weekly plans");
        }

        const plans = (await planResponse.json()) as Array<{
          id?: string;
          fechainiciosemana?: string;
        }>;

        const currentPlan = plans.find(
          (plan) => plan.fechainiciosemana === weekStartDate,
        );
        if (!currentPlan?.id) {
          setPlanSemanalId(null);
          setMealPlan(initialMealPlan);
          setMealPlanIds(initialMealPlanIds);
          return;
        }

        setPlanSemanalId(currentPlan.id);

        const comidasResponse = await fetch(
          `${API_BASE_URL}/planComida/planSemanal/${currentPlan.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        if (!comidasResponse.ok) {
          if (comidasResponse.status === 404) {
            setMealPlan(initialMealPlan);
            setMealPlanIds(initialMealPlanIds);
            return;
          }
          const text = await comidasResponse.text();
          throw new Error(text || "Failed to load meal plan");
        }

        const comidas = (await comidasResponse.json()) as Array<{
          id?: number;
          idplansemanal?: string;
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

        const nextPlanIds: MealPlanIds = {
          Mon: {},
          Tue: {},
          Wed: {},
          Thu: {},
          Fri: {},
          Sat: {},
          Sun: {},
        };

        comidas
          .forEach((item) => {
            const day = item.diasemana;
            const meal = item.tipocomida as MealType | undefined;
            if (!day || !meal || !nextPlan[day]) return;
            if (item.idmenu) {
              nextPlan[day][meal] = item.idmenu;
            }
            if (item.id !== undefined) {
              nextPlanIds[day][meal] = item.id;
            }
          });

        setMealPlan(nextPlan);
        setMealPlanIds(nextPlanIds);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load meal plan";
        setRecipesError(message);
      }
    };

    loadPlan();
  }, [weekStartDate]);

  const filteredRecipes = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return recipes;
    return recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(value),
    );
  }, [recipes, search]);

  const getRecipeById = (id: string) =>
    recipes.find((recipe) => recipe.id === id);

  const handleSelectRecipe = async (recipeId: string | null) => {
    if (!selectingMeal) return;

    setIsSavingPlan(true);
    setRecipesError(null);

    try {
      const token = localStorage.getItem("authToken");
      const currentPlanId = planSemanalId;
      const existingPlanComidaId =
        mealPlanIds[selectingMeal.day]?.[selectingMeal.meal];

      if (!recipeId) {
        if (existingPlanComidaId) {
          const deleteResponse = await fetch(
            `${API_BASE_URL}/planComida/${existingPlanComidaId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          );

          if (!deleteResponse.ok) {
            const text = await deleteResponse.text();
            throw new Error(text || "Failed to clear meal plan");
          }
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

      let planId = currentPlanId;
      if (!planId) {
        if (!userId) {
          throw new Error("Missing user id");
        }

        const planResponse = await fetch(`${API_BASE_URL}/planSemanal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            idusuario: userId,
            fechainiciosemana: weekStartDate,
          }),
        });

        if (!planResponse.ok) {
          const text = await planResponse.text();
          throw new Error(text || "Failed to create weekly plan");
        }

        const planData = (await planResponse.json().catch(() => ({}))) as {
          id?: string;
        };
        if (!planData.id) {
          throw new Error("Plan semanal creado sin id");
        }

        planId = planData.id;
        setPlanSemanalId(planId);
      }

      const method = existingPlanComidaId ? "PUT" : "POST";
      const endpoint = existingPlanComidaId
        ? `${API_BASE_URL}/planComida/${existingPlanComidaId}`
        : `${API_BASE_URL}/planComida`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          idplansemanal: planId,
          diasemana: selectingMeal.day,
          idmenu: recipeId,
          tipocomida: selectingMeal.meal,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to save meal plan");
      }

      const data = (await response.json().catch(() => ({}))) as {
        id?: number;
      };

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
          [selectingMeal.meal]: data.id ?? existingPlanComidaId,
        },
      }));
      setSelectingMeal(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save meal plan";
      setRecipesError(message);
    } finally {
      setIsSavingPlan(false);
    }
  };

  const getDayTotalCalories = (day: string) => {
    const dayPlan = mealPlan[day] || {};
    return mealTypes.reduce((total, { key }) => {
      const recipeId = dayPlan[key];
      if (!recipeId) return total;
      const recipe = getRecipeById(recipeId);
      return total + (recipe?.calories || 0);
    }, 0);
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">
              Meal Planner
            </h1>
            <p className="text-xs text-muted-foreground">
              Assign recipes to each day and meal type
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs"
          onClick={() => {
            setSearch("");
            setSelectingMeal({ day: selectedDay, meal: "lunch" });
          }}
        >
          <Plus className="size-3.5" />
          <span className="hidden xs:inline">Add recipe</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Weekly Plan
                </CardTitle>
              </div>
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
              <div className="-mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none">
                {weekDays.map((day) => (
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
                      {new Date(weekStartDate + "T00:00:00").getDate() +
                        weekDays.indexOf(day)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mb-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                <span className="text-xs font-medium">Daily Total</span>
                <span className="text-sm font-bold text-primary">
                  {getDayTotalCalories(selectedDay)} kcal
                </span>
              </div>

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
        </div>
      </div>

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
                  {
                    mealTypes.find((meal) => meal.key === selectingMeal.meal)
                      ?.label
                  }
                </p>
              </div>
              <div className="flex h-8 w-40 items-center gap-2 rounded-md border border-border px-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search"
                  className="h-7 border-0 bg-transparent px-0 text-xs focus-visible:ring-0"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setSelectingMeal(null)}
                disabled={isSavingPlan}
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[50vh]">
              {isSavingPlan && (
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

              {isLoadingRecipes && (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  Loading menus...
                </div>
              )}
              {recipesError && !isLoadingRecipes && (
                <div className="px-4 py-3 text-xs text-destructive">
                  {recipesError}
                </div>
              )}
              {!isLoadingRecipes &&
                !recipesError &&
                filteredRecipes.map((recipe) => (
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
