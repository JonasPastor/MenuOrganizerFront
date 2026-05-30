"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"

interface IngredientStock {
  id: string
  name: string
  unit: string
  quantity: number
  minQuantity: number
}

interface Recipe {
  id: string
  name: string
  calories: number
}

type MealType = "breakfast" | "lunch" | "dinner" | "snack"

interface MealPlan {
  [day: string]: {
    [meal in MealType]?: string // recipe id
  }
}

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const mealTypes: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
]

// Sample recipes - in a real app, this would come from shared state or API
const availableRecipes: Recipe[] = [
  { id: "1", name: "Greek Yogurt Bowl", calories: 350 },
  { id: "2", name: "Grilled Salmon", calories: 520 },
  { id: "3", name: "Avocado Toast", calories: 320 },
  { id: "4", name: "Quinoa Salad", calories: 420 },
  { id: "5", name: "Chicken Stir-fry", calories: 480 },
  { id: "6", name: "Protein Smoothie", calories: 280 },
  { id: "7", name: "Overnight Oats", calories: 340 },
  { id: "8", name: "Turkey Wrap", calories: 450 },
]

const nutritionStats = [
  { label: "Calories", current: 1850, target: 2200, unit: "kcal", icon: Flame, color: "bg-chart-1" },
  { label: "Protein", current: 95, target: 120, unit: "g", icon: Target, color: "bg-chart-2" },
  { label: "Carbs", current: 220, target: 280, unit: "g", icon: Apple, color: "bg-chart-3" },
  { label: "Water", current: 6, target: 8, unit: "glasses", icon: Droplets, color: "bg-chart-4" },
]

const initialStock: IngredientStock[] = [
  { id: "1", name: "Greek Yogurt", unit: "g", quantity: 500, minQuantity: 200 },
  { id: "2", name: "Mixed Berries", unit: "g", quantity: 150, minQuantity: 100 },
  { id: "3", name: "Honey", unit: "ml", quantity: 250, minQuantity: 50 },
  { id: "4", name: "Granola", unit: "g", quantity: 300, minQuantity: 100 },
  { id: "5", name: "Quinoa", unit: "g", quantity: 400, minQuantity: 200 },
  { id: "6", name: "Olive Oil", unit: "ml", quantity: 400, minQuantity: 100 },
  { id: "7", name: "Salmon Fillet", unit: "g", quantity: 300, minQuantity: 200 },
  { id: "8", name: "Garlic", unit: "g", quantity: 50, minQuantity: 30 },
  { id: "9", name: "Lemon", unit: "pcs", quantity: 4, minQuantity: 2 },
  { id: "10", name: "Chicken Breast", unit: "g", quantity: 500, minQuantity: 300 },
]

const initialMealPlan: MealPlan = {
  Mon: { breakfast: "1", lunch: "4", dinner: "2", snack: "6" },
  Tue: { breakfast: "3", lunch: "8", dinner: "5" },
  Wed: { breakfast: "7", lunch: "4", dinner: "2", snack: "6" },
  Thu: { breakfast: "1", dinner: "5" },
  Fri: { breakfast: "3", lunch: "8", dinner: "2", snack: "6" },
  Sat: { breakfast: "7", lunch: "4", dinner: "5" },
  Sun: { breakfast: "1", lunch: "8", dinner: "2", snack: "6" },
}

export default function DashboardPage() {
  const [selectedDay, setSelectedDay] = useState("Mon")
  const [stock, setStock] = useState<IngredientStock[]>(initialStock)
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [mealPlan, setMealPlan] = useState<MealPlan>(initialMealPlan)
  const [selectingMeal, setSelectingMeal] = useState<{ day: string; meal: MealType } | null>(null)
  const currentWeek = "May 26 - Jun 1"

  const lowStockItems = stock.filter((item) => item.quantity <= item.minQuantity)

  const handleUpdateQuantity = (id: string, delta: number) => {
    setStock(
      stock.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    )
  }

  const handleSetQuantity = (id: string) => {
    const value = parseInt(editValue)
    if (!isNaN(value) && value >= 0) {
      setStock(
        stock.map((item) =>
          item.id === id ? { ...item, quantity: value } : item
        )
      )
    }
    setEditingStock(null)
    setEditValue("")
  }

  const startEditing = (item: IngredientStock) => {
    setEditingStock(item.id)
    setEditValue(item.quantity.toString())
  }

  const getRecipeById = (id: string) => availableRecipes.find((r) => r.id === id)

  const handleSelectRecipe = (recipeId: string | null) => {
    if (!selectingMeal) return
    
    setMealPlan((prev) => ({
      ...prev,
      [selectingMeal.day]: {
        ...prev[selectingMeal.day],
        [selectingMeal.meal]: recipeId || undefined,
      },
    }))
    setSelectingMeal(null)
  }

  const getDayTotalCalories = (day: string) => {
    const dayPlan = mealPlan[day] || {}
    return mealTypes.reduce((total, { key }) => {
      const recipeId = dayPlan[key]
      if (recipeId) {
        const recipe = getRecipeById(recipeId)
        return total + (recipe?.calories || 0)
      }
      return total
    }, 0)
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-base font-semibold leading-tight">Good morning, Jane!</h1>
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

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2">
            {nutritionStats.map((stat) => (
              <Card key={stat.label} className="border-border">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="text-lg font-bold leading-tight">
                        {stat.current}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          /{stat.target}
                        </span>
                      </p>
                    </div>
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${stat.color}`}>
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

          {/* Weekly Meal Planner */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <CardTitle className="text-sm font-semibold">Meal Planner</CardTitle>
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
              {/* Day Selector - Horizontal scroll */}
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
                      {26 + weekDays.indexOf(day)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Day Total Calories */}
              <div className="mb-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                <span className="text-xs font-medium">Daily Total</span>
                <span className="text-sm font-bold text-primary">
                  {getDayTotalCalories(selectedDay)} kcal
                </span>
              </div>

              {/* Meal Cards - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2">
                {mealTypes.map(({ key, label }) => {
                  const recipeId = mealPlan[selectedDay]?.[key]
                  const recipe = recipeId ? getRecipeById(recipeId) : null
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectingMeal({ day: selectedDay, meal: key })}
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
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recipe Selection Modal */}
          {selectingMeal && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
              <Card className="w-full max-w-md max-h-[70vh] overflow-hidden border-border animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border p-3">
                  <div>
                    <CardTitle className="text-sm font-semibold">Select Recipe</CardTitle>
                    <p className="text-[10px] text-muted-foreground">
                      {selectingMeal.day} - {mealTypes.find((m) => m.key === selectingMeal.meal)?.label}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setSelectingMeal(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 overflow-auto max-h-[50vh]">
                  {/* Clear option */}
                  <button
                    onClick={() => handleSelectRecipe(null)}
                    className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left active:bg-secondary"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <X className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No meal</p>
                      <p className="text-[10px] text-muted-foreground">Clear this slot</p>
                    </div>
                  </button>
                  
                  {/* Recipe list */}
                  {availableRecipes.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleSelectRecipe(recipe.id)}
                      className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 active:bg-secondary"
                    >
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <UtensilsCrossed className="size-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{recipe.name}</p>
                        <p className="text-[10px] text-muted-foreground">{recipe.calories} kcal</p>
                      </div>
                      {mealPlan[selectingMeal.day]?.[selectingMeal.meal] === recipe.id && (
                        <div className="size-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Ingredient Stock */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Ingredient Stock</CardTitle>
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
              <div className="space-y-2">
                {stock.map((item) => {
                  const isLow = item.quantity <= item.minQuantity
                  const isEditing = editingStock === item.id
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 ${
                        isLow ? "border-destructive/50 bg-destructive/5" : "border-border bg-secondary/30"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-medium">{item.name}</span>
                          {isLow && (
                            <AlertTriangle className="size-3 shrink-0 text-destructive" />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Min: {item.minQuantity}{item.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleUpdateQuantity(item.id, -10)}
                        >
                          <Minus className="size-3" />
                        </Button>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleSetQuantity(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSetQuantity(item.id)
                              if (e.key === "Escape") {
                                setEditingStock(null)
                                setEditValue("")
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
                            {item.quantity}
                            <span className="ml-0.5 text-muted-foreground">{item.unit}</span>
                          </button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => handleUpdateQuantity(item.id, 10)}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Goals - Stacked on mobile */}
          <div className="space-y-4">
            {/* Recent Activity */}
            <Card className="border-border">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2.5">
                  {[
                    { time: "8:30 AM", action: "Logged breakfast", detail: "Greek Yogurt - 350 kcal" },
                    { time: "10:15 AM", action: "Water intake", detail: "2 glasses added" },
                    { time: "12:45 PM", action: "Logged lunch", detail: "Quinoa Salad - 520 kcal" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <div className="size-1.5 rounded-full bg-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{activity.action}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{activity.detail}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Goals */}
            <Card className="border-border">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-semibold">Weekly Goals</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-3">
                  {[
                    { label: "Calorie target", progress: 85, status: "On track" },
                    { label: "5 veggie servings", progress: 60, status: "3/5 days" },
                    { label: "8 glasses water", progress: 70, status: "5/7 days" },
                  ].map((goal, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{goal.label}</span>
                        <span className="text-[10px] text-muted-foreground">{goal.status}</span>
                      </div>
                      <Progress value={goal.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
