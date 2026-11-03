import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellRing, CheckCheck, Loader2, RefreshCw, WifiOff } from 'lucide-react'
import { adminRequest } from '@/lib/adminApi.js'
import { adminSocket } from '@/lib/adminSocket.js'
import { useAuth } from '@/context/AuthContext.jsx'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'

const MODULE_PATHS = Object.freeze({
  PRE_ADVICE: '/pre-advice', GATE_IN: '/gate-in', GATE_OUT: '/gate-out',
  RELEASE_CONTAINER: '/release-container', PAYMENT_HISTORY: '/invoice-review',
  CLIENT_VERIFICATION: '/client-verification', STORAGE_MONITORING: '/storage-monitoring',
  INVENTORY: '/inventory', CONTAINER_TRACKING: '/container-tracking',
  RATE_SETUP: '/rate-setup', DASHBOARD: '/dashboard',
})

const stamp = value => value ? new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit',
}).format(new Date(value)) : ''

function destination(item, canAccessModule) {
  const selected = [item.module, ...(item.modules || [])]
    .find(module => MODULE_PATHS[module] && canAccessModule(module))
  const module = selected || 'DASHBOARD'
  const path = MODULE_PATHS[module] || '/dashboard'
  const bookingId = item.data?.bookingId || item.data?.id
  if (module === 'PAYMENT_HISTORY' && bookingId) {
    return `${path}?booking=${encodeURIComponent(bookingId)}`
  }
  if (['PRE_ADVICE', 'GATE_IN', 'GATE_OUT', 'RELEASE_CONTAINER'].includes(module) && item.data?.bookingReference) {
    return `${path}?search=${encodeURIComponent(item.data.bookingReference)}`
  }
  return path
}

/** Permission-scoped persistent notifications, reconciled on reconnect. */
export default function NotificationMenu() {
  const { user, canAccessModule } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [connected, setConnected] = useState(adminSocket.connected)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async (nextPage = 1) => {
    if (!(user?._id || user?.id) || user.mustChangePassword) return
    setLoading(true)
    try {
      const response = await adminRequest(`/admin/notifications?page=${nextPage}&limit=30`)
      const data = response.data || {}
      setItems(current => nextPage === 1 ? (data.items || []) : [
        ...current, ...(data.items || []).filter(item => !current.some(previous => previous._id === item._id)),
      ])
      setUnread(data.unread || 0)
      setPage(nextPage)
      setTotalPages(data.pagination?.totalPages || 1)
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [(user?._id || user?.id), user?.mustChangePassword])

  useEffect(() => {
    if (!(user?._id || user?.id) || user.mustChangePassword) {
      setItems([])
      setUnread(0)
      setOpen(false)
      return undefined
    }
    load()
    const reconcile = () => { setConnected(true); load() }
    const onAlert = item => {
      if (!item?._id) return
      // Add it immediately, then reconcile the authoritative unread count.
      setItems(current => current.some(previous => previous._id === item._id) ? current : [item, ...current].slice(0, 100))
      load()
    }
    const onRead = ({ id }) => {
      setItems(current => current.map(item => item._id === id ? { ...item, isRead: true } : item))
      load()
    }
    const onReadAll = () => {
      setItems(current => current.map(item => ({ ...item, isRead: true })))
      setUnread(0)
    }
    const disconnect = () => setConnected(false)
    adminSocket.on('notification:new', onAlert)
    adminSocket.on('notification:read', onRead)
    adminSocket.on('notification:read-all', onReadAll)
    adminSocket.on('connect', reconcile)
    adminSocket.on('disconnect', disconnect)
    adminSocket.on('connect_error', disconnect)
    window.addEventListener('focus', reconcileOnFocus)
    function reconcileOnFocus() { load() }
    // REST fallback while the websocket is unavailable; never lose alerts.
    const fallback = window.setInterval(() => {
      if (!adminSocket.connected) load()
    }, 60000)
    return () => {
      adminSocket.off('notification:new', onAlert)
      adminSocket.off('notification:read', onRead)
      adminSocket.off('notification:read-all', onReadAll)
      adminSocket.off('connect', reconcile)
      adminSocket.off('disconnect', disconnect)
      adminSocket.off('connect_error', disconnect)
      window.removeEventListener('focus', reconcileOnFocus)
      window.clearInterval(fallback)
    }
  }, [(user?._id || user?.id), user?.mustChangePassword, load])

  const markOne = async item => {
    setOpen(false)
    navigate(destination(item, canAccessModule))
    if (item.isRead) return
    try {
      await adminRequest(`/admin/notifications/${item._id}/read`, { method: 'PATCH' })
      setItems(current => current.map(row => row._id === item._id ? { ...row, isRead: true } : row))
      setUnread(current => Math.max(0, current - 1))
    } catch (err) {
      setError(err.message || 'Unable to mark notification as read.')
    }
  }

  const markAll = async () => {
    setBusy(true)
    try {
      await adminRequest('/admin/notifications/read-all', { method: 'PATCH' })
      setItems(current => current.map(row => ({ ...row, isRead: true })))
      setUnread(0)
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to mark all notifications as read.')
    } finally { setBusy(false) }
  }

  return <DropdownMenu open={open} onOpenChange={value => { setOpen(value); if (value) load() }}>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        {unread ? <BellRing aria-hidden="true" className="size-5"/> : <Bell aria-hidden="true" className="size-5"/>}
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white" aria-hidden="true">{unread > 99 ? '99+' : unread}</span>}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-[min(380px,calc(100vw-1.5rem))] overflow-hidden p-0" sideOffset={9}>
      <DropdownMenuLabel className="flex items-center justify-between gap-3 px-4 py-3">
        <div><p>Notifications {unread > 0 && <span className="text-xs text-primary">({unread} unread)</span>}</p>
          <p className={`mt-1 flex items-center gap-1 text-[11px] font-normal ${connected ? 'text-emerald-700' : 'text-amber-700'}`}>
            {!connected && <WifiOff className="size-3"/>}{connected ? 'Realtime connected' : 'Offline: refreshes when reconnected'}
          </p>
        </div>
        <button type="button" aria-label="Refresh notifications" disabled={loading} onClick={event => { event.preventDefault(); load() }}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted disabled:opacity-40">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`}/>
        </button>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="m-0"/>
      {error && <p role="alert" className="mx-3 mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <div className="max-h-[min(56vh,440px)] overflow-y-auto overscroll-contain p-1.5" aria-label="Recent notifications">
        {items.length ? items.map(item => <DropdownMenuItem key={item._id}
          onSelect={() => markOne(item)} className={`mb-0.5 items-start gap-3 px-3 py-3 ${item.isRead ? '' : 'bg-primary/5'}`}>
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-primary'}`}/>
          <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-5">{item.title || 'Booking update'}</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.message || 'A container record was updated.'}</span>
            <time className="mt-1 block text-[11px] text-muted-foreground">{stamp(item.createdAt)}</time>
          </span>
        </DropdownMenuItem>) : <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          {loading ? <Loader2 className="mx-auto mb-2 size-5 animate-spin"/> : <Bell className="mx-auto mb-2 size-5"/>}
          {loading ? 'Loading notifications...' : 'No notifications yet.'}
        </div>}
        {page < totalPages && <button type="button" disabled={loading} onClick={() => load(page + 1)}
          className="w-full rounded-md px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-muted disabled:opacity-50">Load older notifications</button>}
      </div>
      <DropdownMenuSeparator className="m-0"/>
      <div className="flex items-center justify-between px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Saved across sessions</p>
        <button type="button" onClick={markAll} disabled={busy || !unread}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-muted disabled:opacity-40">
          <CheckCheck className="size-4"/>{busy ? 'Saving...' : 'Mark all read'}
        </button>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
}
