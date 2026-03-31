"use client"

import * as React from "react"
import {
  LayoutDashboard,
  CalendarDays,
  TableProperties,
  Clock,
  Share2,
  Settings,
  HeartPulse,
  Moon,
  Sun,
  Zap,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTheme } from "next-themes"

const items = [
  {
    title: "Painel",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Calendário",
    url: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "Reservas",
    url: "/bookings",
    icon: TableProperties,
  },
  {
    title: "Disponibilidade",
    url: "/availability",
    icon: Clock,
  },
  {
    title: "Automações",
    url: "/automations",
    icon: Zap,
  },
  {
    title: "Integrações",
    url: "/integrations",
    icon: Share2,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-md">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50">CardioDash</span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Clínica Especializada</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 gap-2">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.url}
                tooltip={item.title}
                render={<Link href={item.url} />}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 font-medium"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="px-2 pb-2 gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/settings"}
              tooltip="Configurações"
              render={<Link href="/settings" />}
              className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Alternar Tema"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>Alternar Tema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 group-data-[collapsible=icon]:hidden bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-sm" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Dr. Cardiologista</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Administrador</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
