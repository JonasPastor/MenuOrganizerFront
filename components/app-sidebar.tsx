"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  Home,
  Leaf,
  Settings,
  Target,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react"
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
  { icon: TrendingUp, label: "Progress", href: "/progress" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
            <Leaf className="size-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            NutriTrack
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
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            JD
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium">Jane Doe</p>
            <p className="text-xs text-muted-foreground">Premium Plan</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
