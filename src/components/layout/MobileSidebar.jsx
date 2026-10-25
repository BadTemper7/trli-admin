import { Menu } from "lucide-react"
import { useState } from "react"

import BrandLogo from "@/components/layout/BrandLogo.jsx"
import SidebarNav from "@/components/navigation/SidebarNav.jsx"
import UserMenu from "@/components/user/UserMenu.jsx"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.jsx"

// Hamburger + slide-in drawer for tablet and mobile. Closes after a route is selected.
function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open navigation menu"
          className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </SheetTrigger>

      <SheetContent>
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Browse the application sections.
        </SheetDescription>

        <div className="flex h-[72px] shrink-0 items-center border-b border-border px-5">
          <BrandLogo className="h-14" />
        </div>

        <div className="app-scroll app-scroll-slim relative min-h-0 flex-1 overflow-y-auto">
          <SidebarNav onNavigate={close} />
        </div>

        <div className="shrink-0 border-t border-border p-3">
          <UserMenu variant="sidebar" />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileSidebar
