'use client'

import * as React from "react"
import { useSession } from "next-auth/react"
import { IconBell } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { markNotificationAsRead } from "../notifications/actions"
import { Notification } from "@prisma/client"
import Link from "next/link"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface CustomSessionUser {
  id?: string;
  organizationId?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const userId = (session?.user as CustomSessionUser)?.id;
  const orgId = (session?.user as CustomSessionUser)?.organizationId;

  const { data: notifications, error, mutate } = useSWR<Notification[]>(
    userId && orgId ? `/api/notifications?userId=${userId}&orgId=${orgId}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Poll for new notifications every 30 seconds
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  React.useEffect(() => {
    if (error) {
      toast.error("Failed to fetch notifications: " + error.message);
    }
  }, [error]);

  const handleNotificationClick = (notification: Notification) => {
    startTransition(async () => {
      if (!notification.read) {
        try {
          await markNotificationAsRead(notification.id);
          mutate(prev => prev?.map(n => n.id === notification.id ? { ...n, read: true } : n), false); // Optimistic update
          // mutate(); // Revalidate after update if optimistic update is not enough
        } catch (error: unknown) {
          let errorMessage = "Failed to mark notification as read.";
          if (error instanceof Error) {
            errorMessage += " " + error.message;
          }
          toast.error(errorMessage);
        }
      }
      setOpen(false); // Close dropdown
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <IconBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error ? (
          <DropdownMenuItem disabled>Failed to load notifications</DropdownMenuItem>
        ) : !Array.isArray(notifications) || notifications.length === 0 ? (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} onClick={() => handleNotificationClick(notification)}>
              <Link href={notification.link || "#"} className={`block w-full ${notification.read ? "text-muted-foreground" : "font-medium"}`}>
                {notification.message}
                <span className="block text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}