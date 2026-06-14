"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
  Home,
  Leaf,
  LogOut,
  Package,
  Settings,
  Target,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
} from "@/components/ui/sidebar"

const navItems = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Calendar, label: "Meal Planner", href: "/meal-planner" },
  { icon: UtensilsCrossed, label: "Recipes", href: "/recipes" },
  { icon: Target, label: "Goals", href: "/goals" },
  { icon: Package, label: "Stock", href: "/stocks" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ nombre?: string; apellido?: string; email?: string } | null>(
    () => {
      if (typeof window === "undefined") return null
      const stored = localStorage.getItem("authUser")
      if (!stored) return null
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  )

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem("authUser")
      if (!stored) {
        setUser(null)
        return
      }
      try {
        setUser(JSON.parse(stored))
      } catch {
        setUser(null)
      }
    }

    handleStorage()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const fullName = useMemo(() => {
    const nombre = user?.nombre?.trim() ?? ""
    const apellido = user?.apellido?.trim() ?? ""
    const combined = `${nombre} ${apellido}`.trim()
    return combined || user?.email || "Guest"
  }, [user])

  const initials = useMemo(() => {
    if (fullName === "Guest") return "MO"
    const parts = fullName.split(/\s+/).filter(Boolean)
    const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
    return letters || "MO"
  }, [fullName])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("authUser")
    setUser(null)
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
            <Leaf className="size-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            MenuOrganizer
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials}
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">Premium Plan</p>
          </div>
        </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 justify-start gap-2 text-xs"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">Cerrar sesion</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
