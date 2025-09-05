"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconReceipt,
  IconSettings,
  IconUsers,
  IconDatabase,
  IconReport,
  IconFileWord,
  IconCreditCard,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { NavDocuments } from "@/components/nav-documents"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: "admin" | "client";
}

// --- Mock Data ---
// In a real application, you would get the user and their role from a session.
const mockUser = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "https://avatar.vercel.sh/johndoe",
}

// --- Navigation Data based on Role ---
const navItemsAdmin = [
  {
    title: "Dashboard",
    url: "/internal/dashboard",
    icon: IconDashboard,
  },
  {
    title: "Projects",
    url: "/internal/projects",
    icon: IconFolder,
  },
  {
    title: "Invoices",
    url: "/internal/invoices",
    icon: IconReceipt,
  },
  {
    title: "Expenses",
    url: "/internal/expenses",
    icon: IconCreditCard,
  },
  {
    title: "Clients",
    url: "/internal/clients",
    icon: IconUsers,
  },
  {
    title: "Analytics",
    url: "/internal/analytics",
    icon: IconChartBar,
  },
]

const navItemsClient = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: IconDashboard,
  },
  {
    title: "My Projects",
    url: "/client/projects",
    icon: IconFolder,
  },
  {
    title: "My Billing",
    url: "/client/billing",
    icon: IconReceipt,
  },
  {
    title: "Proposals",
    url: "/client/proposals",
    icon: IconFileDescription,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
  },
  {
    title: "Support",
    url: "/support",
    icon: IconHelp,
  },
]

const documents = [
  {
    name: "Data Library",
    url: "/internal/data-library",
    icon: IconDatabase,
  },
  {
    name: "Reports",
    url: "/internal/reports",
    icon: IconReport,
  },
  {
    name: "Word Assistant",
    url: "/internal/word-assistant",
    icon: IconFileWord,
  },
];

export function AppSidebar({ role, ...props }: AppSidebarProps) {
  const isClient = role === "client"
  const mainNav = isClient ? navItemsClient : navItemsAdmin

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">AgencyFlow</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNav} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: mockUser.name,
            email: mockUser.email,
            avatar: mockUser.avatar,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}