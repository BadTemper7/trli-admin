import { Bell } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx"

// `hasUnread` drives the red indicator. There is no notification data yet, so it defaults to off.
function NotificationMenu({ hasUnread = false }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={hasUnread ? "Notifications, new items" : "Notifications"}
          className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell aria-hidden="true" className="size-5" />
          {hasUnread && (
            <span
              aria-hidden="true"
              className="absolute right-2.5 top-2.5 size-2 rounded-full bg-danger-500 ring-2 ring-surface"
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
          No new notifications.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationMenu
