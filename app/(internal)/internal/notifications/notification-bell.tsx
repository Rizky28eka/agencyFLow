"use client"

import * as React from "react"
import { IconBell } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { markNotificationAsRead } from "../notifications/actions"
import { Notification } from "@prisma/client"
import Link from "next/link"
import { toast } from "sonner"
import useSWR from "swr"

// IMPORTANT: Replace these with actual user and organization IDs from your database
// In a real application, these would come from the user's session or authentication context.
const CURRENT_USER_ID = "clx0123456789abcdef0123456"; // Example ID, replace with a real user ID
const CURRENT_ORG_ID = "cmf6tttw10000t46efkctz384"; // Example ID, replace with your organization ID

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const { data: notifications, error, mutate } = useSWR<Notification[]>(
    `/api/notifications?userId=${CURRENT_USER_ID}&orgId=${CURRENT_ORG_ID}`,
    fetcher,
    {
      refreshInterval: 30000, // Poll for new notifications every 30 seconds
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  );

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

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
        } catch (error: any) {
          toast.error("Failed to mark notification as read: " + error.message);
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
        {!notifications || notifications.length === 0 ? (
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
