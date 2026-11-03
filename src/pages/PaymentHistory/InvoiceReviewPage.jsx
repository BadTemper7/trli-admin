import {useBulkDeletion,RowActions,SelectRecord,BulkDeleteToolbar,DeletionDialog,DeletionFeedback} from '@/components/deletion/DeletionControls.jsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, FileText, Search } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer.jsx';
import PageHeader from '@/components/layout/PageHeader.jsx';
import OptionalChargesModal from '@/components/invoices/OptionalChargesModal.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { MODULES, ACTIONS } from '@/constants/permissions.js';
import { adminRequest } from '@/lib/adminApi.js';
import { adminSocket } from '@/lib/adminSocket.js';
import { openAdminFile } from '@/lib/adminFiles.js';

const peso = value => new Intl.NumberFormat('en-PH', {style:'currency',currency:'PHP'}).format(Number(value || 0));
const pretty = value => String(value || '').replaceAll('_',' ') || '—';
const badge = status => status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : status === 'PAYMENT_SUBMITTED' ? 'bg-sky-100 text-sky-700' : status === 'UNPAID' ? 'bg-amber-100 text-amber-800' : 'bg-muted text-foreground';
const time = value => value ? new Date(value).toLocaleString('en-PH', {timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'}) : '—';

export default function InvoiceReviewPage() {
  const {can} = useAuth();
  const [searchParams] = useSearchParams();
  const bookingFilter = searchParams.get('booking');
  const [invoices, setInvoices] = useState([]);
  const [details, setDetails] = useState(null);
  const [optionalInvoice, setOptionalInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page:1, limit:20, total:0, totalPages:1 });
  const [cards, setCards] = useState({ gateInPending:0, unpaid:0, paid:0 });
  useEffect(() => { const timeout = window.setTimeout(() => {setDebouncedQuery(query.trim());setPage(1);},300);return () => window.clearTimeout(timeout); }, [query]);

  const refresh = useCallback(async () => {
    try {
      const q = new URLSearchParams({page:String(page),limit:'20'});
      if (bookingFilter) q.set('booking',bookingFilter);
      if (debouncedQuery) q.set('search',debouncedQuery);
      if (filter !== 'ALL') q.set(filter.startsWith('GATE_')?'type':'status',filter);
      const result = await adminRequest(`/admin/invoices?${q}`);
      setInvoices(result.data?.items || []);
      setPagination(result.data?.pagination || {page,limit:20,total:0,totalPages:1});
      setError('');
    } catch (err) { setError(err.message || 'Unable to load invoice history.'); }
  }, [bookingFilter, debouncedQuery, filter, page]);
  const refreshCards = useCallback(async () => {
    try {
      const q = new URLSearchParams({scope:'filtered'});
      if (bookingFilter) q.set('booking',bookingFilter);
      if (debouncedQuery) q.set('search',debouncedQuery);
      // Counts are independent of the selected status/type, not of search.
      const result = await adminRequest(`/admin/invoices/summary?${q}`);
      setCards(result.data?.summary || {gateInPending:0,unpaid:0,paid:0});
    } catch { /* Keep existing counts if the summary is temporarily unavailable. */ }
  }, [bookingFilter, debouncedQuery]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => { refreshCards(); }, [refreshCards]);
  useEffect(() => {
    const reload = () => { refresh(); refreshCards(); };
    for (const event of ['gate-in:updated','gate-in:queue-updated','gate-out:updated','invoice:updated','notification:new','connect']) adminSocket.on(event, reload);
    return () => { for (const event of ['gate-in:updated','gate-in:queue-updated','gate-out:updated','invoice:updated','notification:new','connect']) adminSocket.off(event, reload); };
  }, [refresh, refreshCards]);

  const showDetails = async id => {
    setLoadingDetails(true);setError('');
    try {
      const result = await adminRequest(`/admin/invoices/${id}`);
      setDetails(result.data || null);
    } catch (err) {
      setError(err.message || 'Unable to load invoice details.');
    } finally { setLoadingDetails(false); }
  };

  const deletion = useBulkDeletion(MODULES.PAYMENT_HISTORY,{onDeleted:refresh});
  const shown = invoices; // The server applies filters before pagination.
  const download = path => openAdminFile(path, true).catch(err => setError(err.message));

  return <PageContainer>
    <PageHeader title="Invoices & Payment History" description="View invoice balances, payment attempts, receipt documents, and manual billing charges. Gate-in payment approval is now completed inside Gate-in Processing." />
    <div className="min-w-0 space-y-5">
    <section className="grid gap-3 sm:grid-cols-3">
      {[
        ['Awaiting payment review', cards.gateInPending, Clock3],
        ['Unpaid invoices', cards.unpaid, FileText],
        ['Paid invoices', cards.paid, CheckCircle2],
      ].map(([title,value,Icon]) => <div key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span>
        <div><strong className="text-2xl font-extrabold">{value}</strong><p className="text-xs font-bold text-muted-foreground">{title}</p></div>
      </div>)}
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
      <p><strong>Verify Gate-in payments in Gate-in Processing.</strong> Select the booking, review its payment evidence, and verify or reject it there. Invoice history remains read-only for payments.</p>
      <Link to="/gate-in" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary">Open Gate-in <ArrowRight size={15}/></Link>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <DeletionFeedback control={deletion}/><section className="rounded-2xl border border-border bg-card shadow-sm"><BulkDeleteToolbar control={deletion} ids={shown.filter(i=>['UNPAID','CANCELLED','VOID'].includes(i.status)).map(i=>i._id)}/>
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-extrabold">Invoice records</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className="h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm" placeholder="Invoice number (prefix)" aria-label="Search invoices" value={query} onChange={event => setQuery(event.target.value)}/></div>
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" aria-label="Invoice filter" value={filter} onChange={event => {setFilter(event.target.value);setPage(1)}}>{[['ALL','All'],['GATE_IN','Gate-in'],['GATE_OUT','Gate-out'],['UNPAID','Unpaid'],['PAYMENT_SUBMITTED','Under verification'],['PAID','Paid']].map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select>
        </div>
      </div>
      {bookingFilter && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-sky-50 p-3 text-xs font-semibold text-sky-900"><span>Showing invoices linked to a selected booking.</span><Link to="/invoice-review" className="text-primary underline underline-offset-4">Clear booking filter</Link></div>}
      {loading ? <div className="p-5"><div className="h-40 animate-pulse rounded-xl bg-muted"/></div> : shown.length ? <div className="divide-y divide-border">{shown.map(invoice => <div key={invoice._id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">{deletion.allowed&&<SelectRecord label={`Select invoice ${invoice.number}`} checked={deletion.selected.includes(invoice._id)} onChange={v=>deletion.toggle(invoice._id,v)}/>}
        <div className="min-w-0"><strong>{invoice.number}</strong><p className="mt-1 text-xs text-muted-foreground">{invoice.company?.companyName || 'Client'} · {pretty(invoice.type)}</p></div>
        <strong>{peso(invoice.total)}</strong>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge(invoice.status)}`}>{pretty(invoice.status)}</span>
        <div className="flex flex-wrap gap-3">
          {invoice.type === 'GATE_IN' && invoice.status === 'UNPAID' && can(MODULES.GATE_IN,ACTIONS.PROCESS) && <button type="button" className="font-bold text-primary underline" onClick={() => setOptionalInvoice(invoice._id)}>Add booking transaction</button>}
          <button type="button" className="font-bold text-primary underline" onClick={() => showDetails(invoice._id)}>View history</button>
          <button type="button" className="font-bold text-primary underline" onClick={() => download(`/admin/invoices/${invoice._id}/pdf`)}>Invoice PDF</button>
          {invoice.status === 'PAID' && <button type="button" className="font-bold text-primary underline" onClick={() => download(`/admin/invoices/${invoice._id}/receipt`)}>Receipt PDF</button>}
          <RowActions items={[{label:"View payment history",onClick:()=>showDetails(invoice._id)},{label:"Download invoice",onClick:()=>download(`/admin/invoices/${invoice._id}/pdf`)},...(invoice.status==='PAID'?[{label:"Download receipt",onClick:()=>download(`/admin/invoices/${invoice._id}/receipt`)}]:[])]} canDelete={deletion.allowed&&['UNPAID','CANCELLED','VOID'].includes(invoice.status)} onDelete={()=>deletion.ask([invoice._id])}/>
        </div>
      </div>)}</div> : <div className="p-12 text-center text-sm text-muted-foreground">No invoices match your filters.</div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm">
        <span>Showing {shown.length} of {pagination.total ?? 0} matching invoices · Page {page} of {pagination.totalPages ?? 1}</span>
        <div className="flex gap-2">
          <button type="button" className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40" disabled={page===1} onClick={()=>setPage(value=>value-1)}>Previous</button>
          <button type="button" className="rounded-lg border px-3 py-2 font-bold disabled:opacity-40" disabled={page>=(pagination.totalPages||1)} onClick={()=>setPage(value=>value+1)}>Next</button>
        </div>
      </div>
    </section>
    {loadingDetails && <div role="status" className="rounded-xl border bg-card p-4 text-sm">Loading payment history…</div>}
    {details && <section className="rounded-2xl border border-border bg-card p-5" aria-label="Invoice payment history">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-extrabold">Payment history · {details.invoice?.number}</h2><p className="mt-1 text-sm text-muted-foreground">{pretty(details.invoice?.status)} · {peso(details.invoice?.total)}</p></div><button type="button" className="rounded-lg border px-3 py-2 text-sm font-bold" onClick={() => setDetails(null)}>Close</button></div>
      <div className="mt-4 space-y-3">{(details.payments || []).length ? details.payments.map(payment => <div key={payment._id} className="rounded-xl border border-border p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{pretty(payment.status)}</strong><span>{peso(payment.amount)}</span></div>
        <p className="mt-1 text-xs text-muted-foreground">{payment.method} · {payment.reference || 'Proof only'} · Submitted {time(payment.createdAt)}</p>
        {payment.verifiedAt && <p className="mt-1 text-xs text-muted-foreground">Reviewed {time(payment.verifiedAt)} · Receipt {payment.receiptNumber || '—'}</p>}
        {payment.rejectionReason && <p className="mt-1 text-xs text-red-700">Reason: {payment.rejectionReason}</p>}
        {details.invoice?.type === 'GATE_IN' && payment.proof?.storedName && can(MODULES.GATE_IN,ACTIONS.PROCESS) && <button type="button" className="mt-2 text-xs font-bold text-primary underline" onClick={() => openAdminFile(`/admin/invoices/payments/${payment._id}/proof`).catch(err => setError(err.message))}>View submitted proof</button>}
      </div>) : <p className="text-sm text-muted-foreground">No payment submissions for this invoice.</p>}</div>
      <p className="mt-3 text-xs text-muted-foreground">Payment review is not available here. Gate-in verification must be performed in Gate-in Processing.</p>
    </section>}
    <DeletionDialog control={deletion}/>
    {optionalInvoice && <OptionalChargesModal invoiceId={optionalInvoice} onClose={() => setOptionalInvoice(null)} onSaved={() => {setOptionalInvoice(null);refresh();}}/>}
    </div>
  </PageContainer>;
}
