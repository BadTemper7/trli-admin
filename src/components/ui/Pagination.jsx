import { Button } from '@/components/ui/button.jsx'
export default function Pagination({ page = 1, totalPages = 1, total = 0, onPage }) {
  if (totalPages <= 1) return <div className="text-xs text-muted-foreground">{total} record{total === 1 ? '' : 's'}</div>
  return <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Page {page} of {totalPages} · {total} records</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button></div></div>
}
