import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"

import AppBreadcrumb from "@/components/layout/AppBreadcrumb.jsx"
import MobileSidebar from "@/components/layout/MobileSidebar.jsx"
import NotificationMenu from "@/components/user/NotificationMenu.jsx"
import UserMenu from "@/components/user/UserMenu.jsx"
import { Input } from "@/components/ui/input.jsx"

function AppHeader({ collapsed, onToggleSidebar }) {
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-2 border-b border-border bg-surface px-4 sm:px-6">
      <MobileSidebar />

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-pressed={collapsed}
        className="hidden size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        <ToggleIcon aria-hidden="true" className="size-5" />
      </button>

      <div className="min-w-0 flex-1 pl-1">
        <AppBreadcrumb />
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* UI-only search. Full field from md up, icon button below. */}
        <div role="search" className="relative hidden md:block">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            aria-label="Search"
            placeholder="Search..."
            className="w-56 bg-background pl-9 lg:w-72"
          />
        </div>
        <button
          type="button"
          aria-label="Search"
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Search aria-hidden="true" className="size-5" />
        </button>

        <NotificationMenu />
        <UserMenu variant="header" />
      </div>
    </header>
  )
}

export default AppHeader
