import { X } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

export default function OperationDrawer({ open, title, subtitle, onClose, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/30 backdrop-blur-[1px]" onMouseDown={onClose}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/95 px-6 py-5 backdrop-blur">
          <div><h2 className="text-xl font-bold text-foreground">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X size={18} /></Button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="sticky bottom-0 border-t border-border bg-background px-6 py-4">{footer}</div>}
      </aside>
    </div>
  )
}
