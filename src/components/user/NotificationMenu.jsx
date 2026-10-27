import { useEffect, useState } from 'react'
import { Bell, WifiOff } from 'lucide-react'
import { adminSocket } from '@/lib/adminSocket.js'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'

const formatTime = date => date ? new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit'
}).format(new Date(date)) : ''

/** Live-only admin alerts. There is no admin notification-history GET API. */
function NotificationMenu() {
  const [alerts, setAlerts] = useState([])
  const [connected, setConnected] = useState(adminSocket.connected)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onAlert = payload => {
      if (!payload) return
      setAlerts(current => {
        const id = payload._id || payload.id
        if (id && current.some(item => (item._id || item.id) === id)) return current
        return [payload, ...current].slice(0, 40)
      })
    }
    const onConnected = () => setConnected(true)
    const onDisconnected = () => setConnected(false)
    adminSocket.on('notification:new', onAlert)
    adminSocket.on('connect', onConnected)
    adminSocket.on('disconnect', onDisconnected)
    adminSocket.on('connect_error', onDisconnected)
    return () => {
      adminSocket.off('notification:new', onAlert)
      adminSocket.off('connect', onConnected)
      adminSocket.off('disconnect', onDisconnected)
      adminSocket.off('connect_error', onDisconnected)
    }
  }, [])

  const unread = alerts.filter(item => !item.viewed).length
  return <DropdownMenu open={open} onOpenChange={value => {
    setOpen(value)
    if (value) setAlerts(current => current.map(item => ({ ...item, viewed: true })))
  }}>
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={unread ? `Notifications, ${unread} new items` : 'Notifications'}
        className="relative flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Bell aria-hidden="true" className="size-5" />
        {unread > 0 && <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-danger-500 ring-2 ring-surface"/>}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="max-h-[400px] w-[min(320px,calc(100vw-2rem))] overflow-y-auto">
      <DropdownMenuLabel className="flex items-center justify-between gap-2">Live notifications <span className={`text-xs font-medium ${connected ? 'text-emerald-600' : 'text-amber-700'}`}>{connected ? 'Connected' : 'Disconnected'}</span></DropdownMenuLabel>
      <DropdownMenuSeparator />
      {alerts.length ? alerts.map((item, index) => <div key={item._id || `${item.type}-${index}`} className="border-b border-border px-3 py-2.5 last:border-0"><p className="text-sm font-bold">{item.title || 'Booking update'}</p><p className="mt-1 text-xs text-muted-foreground">{item.message || 'A container record was updated.'}</p><p className="mt-1 text-[11px] text-muted-foreground">{formatTime(item.createdAt)}</p></div>) : <div className="space-y-2 px-3 py-6 text-center text-xs text-muted-foreground">{!connected && <WifiOff className="mx-auto size-6 text-amber-600"/>}<p>{connected ? 'No live alerts in this session.' : 'Realtime connection unavailable. Data tables can still refresh.'}</p></div>}
      <p className="px-3 py-2 text-[11px] text-muted-foreground">Shows events received since this admin page opened. The current API does not expose an admin notification history endpoint.</p>
    </DropdownMenuContent>
  </DropdownMenu>
}

export default NotificationMenu
