import * as React from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"

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
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// --- Navigation Data ---
const navItemsAdmin = [
  {
    title: "Dashboard",
    url: "/internal/dashboard",
    icon: "dashboard",
  },
  {
    title: "Projects",
    url: "/internal/projects",
    icon: "projects",
  },
  {
    title: "Resource Management",
    url: "/internal/resource-management",
    icon: "resource-management",
  },
  {
    title: "Invoices",
    url: "/internal/invoices",
    icon: "invoices",
  },
  {
    title: "Contracts",
    url: "/internal/contracts",
    icon: "contracts",
  },
  {
    title: "Expenses",
    url: "/internal/expenses",
    icon: "expenses",
  },
  {
    title: "Clients",
    url: "/internal/clients",
    icon: "clients",
  },
  {
    title: "Analytics",
    url: "/internal/analytics",
    icon: "analytics",
  },
  {
    title: "Users",
    url: "/internal/users",
    icon: "users",
  },
]

const navItemsClient = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: "dashboard",
  },
  {
    title: "My Projects",
    url: "/client/projects",
    icon: "projects",
  },
  {
    title: "My Billing",
    url: "/client/billing",
    icon: "invoices",
  },
  {
    title: "Proposals",
    url: "/client/proposals",
    icon: "contracts",
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: "settings",
  },
  {
    title: "Support",
    url: "/support",
    icon: "support",
  },
]

const documents = [
  {
    name: "Data Library",
    url: "/internal/data-library",
    icon: "data-library",
  },
  {
    name: "Reports",
    url: "/internal/reports",
    icon: "reports",
  },
  {
    name: "Word Assistant",
    url: "/internal/word-assistant",
    icon: "word-assistant",
  },
];

export async function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const session = await getServerSession(authOptions);
  
  // Determine role and navigation items based on session
  const role = session?.user?.role ?? 'CLIENT';
  const isClient = role === "CLIENT";
  const mainNav = isClient ? navItemsClient : navItemsAdmin;

  const user = session?.user ? {
    name: session.user.name ?? 'User',
    email: session.user.email ?? '',
    avatar: session.user.image ?? `/placeholder-avatar.png`,
  } : {
    name: 'Guest',
    email: '',
    avatar: '/placeholder-avatar.png',
  }

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
        {!isClient && <NavDocuments items={documents} />}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}