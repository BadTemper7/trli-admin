import { useCallback, useState } from "react"

import { SIDEBAR_STORAGE_KEY } from "@/config/app.js"

function readStored() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readStored)

  const toggleSidebar = useCallback(() => {
    setCollapsed((previous) => {
      const next = !previous
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        // Storage can be unavailable (private mode); the toggle still works.
      }
      return next
    })
  }, [])

  return { collapsed, toggleSidebar }
}
