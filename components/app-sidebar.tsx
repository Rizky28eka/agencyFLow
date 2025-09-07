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
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  navItemsAdmin,
  navItemsProjectManager,
  navItemsMember,
  navItemsClient as navItemsClientConfig,
  navSecondary,
  documents
} from "@/config/navigation";
import { getClientProjects, getOutstandingClientInvoices, getClientQuotations } from "@/app/actions/client-data";
import { QuotationStatus, UserRole } from "@prisma/client";

export async function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const session = await getServerSession(authOptions);
  
  const role = session?.user?.role ?? UserRole.CLIENT;
  const isClient = role === UserRole.CLIENT;

  let mainNav;

  switch (role) {
    case UserRole.ADMIN:
      mainNav = navItemsAdmin;
      break;
    case UserRole.PROJECT_MANAGER:
      mainNav = navItemsProjectManager;
      break;
    case UserRole.MEMBER:
      mainNav = navItemsMember;
      break;
    case UserRole.CLIENT:
      const [projects, outstandingInvoices, quotations] = await Promise.all([
        getClientProjects(),
        getOutstandingClientInvoices(),
                  getClientQuotations(),
      ]);
      const pendingQuotations = quotations.filter(q => q.status === QuotationStatus.SENT || q.status === QuotationStatus.VIEWED).length;
      mainNav = navItemsClientConfig.map(item => {
        if (item.title === "My Projects") return { ...item, label: projects.length.toString() };
        if (item.title === "My Billing") return { ...item, label: outstandingInvoices.length.toString() };
        if (item.title === "Proposals") return { ...item, label: pendingQuotations.toString() };
        return item;
      });
      break;
    default:
      mainNav = [];
      break;
  }

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
        <SidebarGroup>
          <NavMain items={mainNav} isClient={isClient} />
        </SidebarGroup>
        
        {!isClient && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Documents</SidebarGroupLabel>
              <NavDocuments items={documents} />
            </SidebarGroup>
          </>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarSeparator />
          <NavSecondary items={navSecondary} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
