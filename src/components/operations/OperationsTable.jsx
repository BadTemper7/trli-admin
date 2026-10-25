import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input.jsx'
import TableSkeleton from '@/components/ui/TableSkeleton.jsx'
import Pagination from '@/components/ui/Pagination.jsx'
import { OperationStatus } from './OperationStatus.jsx'

export default function OperationsTable({ rows, search, onSearch, onSelect, empty = 'No records found.', extraColumns = null, loading = false, pagination = null, onPage = null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search booking or container..." className="pl-9" /></div>
        <span className="ml-auto text-sm text-muted-foreground">{pagination?.total ?? rows.length} record{(pagination?.total ?? rows.length) === 1 ? '' : 's'}</span>
      </div>
      {loading ? <div className="p-4"><TableSkeleton rows={6} columns={6} /></div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Booking</th><th className="px-5 py-3">Container</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Stage</th>{extraColumns?.header}<th className="px-5 py-3 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => <tr key={row.id} className="hover:bg-muted/40"><td className="px-5 py-4 font-semibold text-foreground">{row.bookingReference}</td><td className="px-5 py-4"><div className="font-medium">{row.containerNumber}</div><div className="text-xs text-muted-foreground">{row.containerSize} · {row.loadStatus}</div></td><td className="px-5 py-4">{row.company?.companyName || '—'}</td><td className="px-5 py-4"><div>{row.scheduledGateDateIn}</div><div className="text-xs text-muted-foreground">{row.scheduledGateTimeIn}</div></td><td className="px-5 py-4"><OperationStatus stage={row.workflowStage} /></td>{extraColumns?.cell?.(row)}<td className="px-5 py-4 text-right"><button type="button" onClick={() => onSelect(row)} className="font-semibold text-primary hover:underline">Open</button></td></tr>)}
            {!rows.length && <tr><td colSpan={extraColumns ? 7 : 6} className="px-5 py-14 text-center text-muted-foreground">{empty}</td></tr>}
          </tbody>
        </table>
      </div>}
      {!loading && pagination && onPage && <div className="border-t border-border px-5 py-4"><Pagination {...pagination} onPage={onPage} /></div>}
    </div>
  )
}
