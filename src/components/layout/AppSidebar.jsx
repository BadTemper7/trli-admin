import BrandLogo from "@/components/layout/BrandLogo.jsx"
import SidebarNav from "@/components/navigation/SidebarNav.jsx"
import UserMenu from "@/components/user/UserMenu.jsx"
import { cn } from "@/lib/utils.js"

// Desktop sidebar. Hidden below the lg breakpoint, where MobileSidebar takes over.
function AppSidebar({ collapsed }) {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 ease-out lg:flex",
        collapsed ? "w-[76px]" : "w-[268px]"
      )}
    >
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-border",
          collapsed ? "justify-center px-2" : "px-5"
        )}
      >
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <BrandLogo className={collapsed ? "h-9" : "h-11"} />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-extrabold tracking-[-0.02em] text-foreground">Trans Roadway</div>
              <div className="truncate text-xs font-semibold text-muted-foreground">Logistics Inc.</div>
            </div>
          )}
        </div>
      </div>

      <div className="app-scroll app-scroll-slim relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <UserMenu variant="sidebar" collapsed={collapsed} />
      </div>
    </aside>
  )
}

export default AppSidebar
