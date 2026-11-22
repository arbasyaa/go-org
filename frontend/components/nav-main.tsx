"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { NavGroup, NavItem } from "@/lib/types"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon, CircleIcon } from "lucide-react"

function NavCollapsibleItem({
  item,
  activeUrl,
}: {
  item: NavItem
  activeUrl: string | null
}) {
  const hasActiveSub = !!item.items?.some((sub) => sub.url === activeUrl)
  const [open, setOpen] = useState(hasActiveSub)
  const [wasActive, setWasActive] = useState(hasActiveSub)

  if (hasActiveSub !== wasActive) {
    setWasActive(hasActiveSub)
    if (hasActiveSub) setOpen(true)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      render={<SidebarMenuItem />}
    >
      <SidebarMenuButton tooltip={item.title} render={<Link href={item.url} />}>
        {item.icon ?? <CircleIcon className="size-4" />}
        <span>{item.title}</span>
      </SidebarMenuButton>
      <CollapsibleTrigger
        render={<SidebarMenuAction className="aria-expanded:rotate-90" />}
      >
        <ChevronRightIcon />
        <span className="sr-only">Toggle</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.items?.map((subItem) => (
            <SidebarMenuSubItem key={subItem.url}>
              <SidebarMenuSubButton
                isActive={subItem.url === activeUrl}
                render={<Link href={subItem.url} />}
              >
                <span>{subItem.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Satu SidebarGroup per NavGroup; grup pertama tanpa label. */
export function NavMain({
  groups,
  activeUrl,
}: {
  groups: NavGroup[]
  activeUrl: string | null
}) {
  return (
    <>
      {groups.map((group, index) => (
        <SidebarGroup key={group.label ?? `group-${index}`}>
          {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
          <SidebarMenu>
            {group.items.map((item) =>
              item.items?.length ? (
                <NavCollapsibleItem
                  key={item.title}
                  item={item}
                  activeUrl={activeUrl}
                />
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.url === activeUrl}
                    render={<Link href={item.url} />}
                  >
                    {item.icon ?? <CircleIcon className="size-4" />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  )
}
