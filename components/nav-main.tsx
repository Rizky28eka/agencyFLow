'use client'

import { IconCirclePlusFilled, IconMail } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";

const quickCreateItems = [
  { title: "New Project", url: "/internal/projects/new" },
  { title: "New Invoice", url: "/internal/invoices/new" },
  { title: "New Quotation", url: "/internal/quotations/new" },
  { title: "New Client", url: "/internal/clients/new" },
];

export function NavMain({
  items,
  isClient = false,
}: {
  items: {
    title: string
    url: string
    icon?: string
    label?: string
  }[],
  isClient?: boolean
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        
        {!isClient && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Quick Create"
                    variant="outline"
                    className="w-full"
                  >
                    <IconCirclePlusFilled />
                    <span>Quick Create</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {quickCreateItems.map((item) => (
                    <DropdownMenuItem key={item.title} asChild>
                      <Link href={item.url}>{item.title}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={pathname.startsWith(item.url)}>
                <Link href={item.url} className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    {item.icon && <Icon name={item.icon} />}
                    <span>{item.title}</span>
                  </div>
                  {item.label && <Badge variant="secondary">{item.label}</Badge>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}