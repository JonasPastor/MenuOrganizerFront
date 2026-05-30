"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Home,
  Leaf,
  Plus,
  Settings,
  Target,
  TrendingUp,
  UtensilsCrossed,
  Droplets,
  Apple,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const navItems = [
  { icon: Home, label: "Dashboard", active: true },
  { icon: Calendar, label: "Meal Planner", active: false },
  { icon: UtensilsCrossed, label: "Recipes", active: false },
  { icon: Settings, label: "Settings", active: false },
]

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const mealPlan = {
  Mon: {
    breakfast: "Greek Yogurt Bowl",
    lunch: "Quinoa Salad",
    dinner: "Grilled Salmon",
    snack: "Mixed Nuts",
  },
  Tue: {
    breakfast: "Avocado Toast",
    lunch: "Chicken Wrap",
    dinner: "Vegetable Stir-fry",
    snack: "Apple Slices",
  },
  Wed: {
    breakfast: "Oatmeal",
    lunch: "Lentil Soup",
    dinner: "Turkey Meatballs",
    snack: "Protein Bar",
  },
  Thu: {
    breakfast: "Smoothie Bowl",
    lunch: "Tuna Salad",
    dinner: "Baked Chicken",
    snack: "Greek Yogurt",
  },
  Fri: {
    breakfast: "Eggs Benedict",
    lunch: "Buddha Bowl",
    dinner: "Fish Tacos",
    snack: "Hummus & Veggies",
  },
  Sat: {
    breakfast: "Pancakes",
    lunch: "Grilled Cheese",
    dinner: "Pasta Primavera",
    snack: "Dark Chocolate",
  },
  Sun: {
    breakfast: "French Toast",
    lunch: "Caesar Salad",
    dinner: "Roast Chicken",
    snack: "Fresh Berries",
  },
}

const nutritionStats = [
  { label: "Calories", current: 1850, target: 2200, unit: "kcal", icon: Flame, color: "bg-chart-1" },
  { label: "Protein", current: 95, target: 120, unit: "g", icon: Target, color: "bg-chart-2" },
  { label: "Carbs", current: 220, target: 280, unit: "g", icon: Apple, color: "bg-chart-3" },
  { label: "Water", current: 6, target: 8, unit: "glasses", icon: Droplets, color: "bg-chart-4" },
]

export default function NutritionDashboard() {
  const [selectedDay, setSelectedDay] = useState("Mon")
  const [userNombre, setUserNombre] = useState("")
  const [userApellido, setUserApellido] = useState("")
  const currentWeek = "May 26 - Jun 1"

  useEffect(() => {
    const storedNombre =
      sessionStorage.getItem("userNombre") || localStorage.getItem("userNombre") || ""
    const storedApellido =
      sessionStorage.getItem("userApellido") || localStorage.getItem("userApellido") || ""

    setUserNombre(storedNombre)
    setUserApellido(storedApellido)
  }, [])

  const displayName = [userNombre, userApellido].filter(Boolean).join(" ") || "Usuario"
  const initials = `${userNombre?.[0] || ""}${userApellido?.[0] || ""}`.toUpperCase() || "U"

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
                <Leaf className="size-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
                MenuOrganizer
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton isActive={item.active} tooltip={item.label}>
                        <item.icon className="size-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">Premium Plan</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-base font-semibold leading-tight">Good morning, {displayName}!</h1>
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

                  {/* Meal Cards - 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {(["breakfast", "lunch", "dinner", "snack"] as const).map((meal) => (
                      <div
                        key={meal}
                        className="rounded-lg border border-border bg-secondary/50 p-2.5 active:bg-secondary"
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {meal}
                        </span>
                        <p className="mt-0.5 truncate text-xs font-medium">
                          {mealPlan[selectedDay as keyof typeof mealPlan][meal]}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {meal === "breakfast" && "350 kcal"}
                          {meal === "lunch" && "520 kcal"}
                          {meal === "dinner" && "680 kcal"}
                          {meal === "snack" && "200 kcal"}
                        </p>
                      </div>
                    ))}
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
      </div>
    </SidebarProvider>
  )
}
