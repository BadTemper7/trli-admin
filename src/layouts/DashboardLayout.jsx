import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"

import AppHeader from "@/components/layout/AppHeader.jsx"
import AppSidebar from "@/components/layout/AppSidebar.jsx"
import { TooltipProvider } from "@/components/ui/tooltip.jsx"
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed.js"

// Authenticated shell: sidebar + header + scrolling content area.
function DashboardLayout() {
  const { collapsed, toggleSidebar } = useSidebarCollapsed()
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  // Start each page at the top when navigating.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <TooltipProvider>
      <div className="relative flex h-dvh w-full overflow-hidden bg-background">
        <AppSidebar collapsed={collapsed} />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
          <main
            ref={mainRef}
            id="main-content"
            className="app-scroll relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default DashboardLayout
