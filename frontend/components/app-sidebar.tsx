"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/components/providers/auth-provider"
import { useSettings } from "@/hooks/use-settings"
import { DEFAULT_LOGO_URL, DEFAULT_SITE_NAME } from "@/lib/brand"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { filterNav, findActiveUrl, portalNav } from "@/lib/nav-config"
import { storageUrl } from "@/lib/storage-url"

export function AppSidebar(
  props: Omit<React.ComponentProps<typeof Sidebar>, "variant">
) {
  const pathname = usePathname()
  const { user, hasPermission } = useAuth()
  const { settings } = useSettings()
  const siteName = settings?.web_name || DEFAULT_SITE_NAME
  const logoUrl = settings?.logo_url ? storageUrl(settings.logo_url) : DEFAULT_LOGO_URL

  const groups = filterNav(portalNav, hasPermission)
  const activeUrl = findActiveUrl(groups, pathname)

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-background ring-1 ring-sidebar-border">
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="size-full object-contain"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{siteName}</span>
                <span className="truncate text-xs">Portal Pengurus</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain groups={groups} activeUrl={activeUrl} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.full_name || user?.username || "Pengguna",
            email: user?.email || user?.username || "",
            avatar: user?.avatar_url ? storageUrl(user.avatar_url) : "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
