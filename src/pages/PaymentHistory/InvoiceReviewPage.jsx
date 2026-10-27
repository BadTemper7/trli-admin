import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
<<<<<<< HEAD
import { ArrowRight, CheckCircle2, Clock3, FileText, Search } from 'lucide-react';
=======
import { ArrowRight, CheckCircle2, Clock3, CreditCard, FileText, Search, ShieldAlert } from 'lucide-react';
>>>>>>> eb1edb6baa48f1692cec002aa79d5d90f406662b
import OptionalChargesModal from '@/components/invoices/OptionalChargesModal.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { MODULES, ACTIONS } from '@/constants/permissions.js';
import { adminRequest } from '@/lib/adminApi.js';
import { adminSocket } from '@/lib/adminSocket.js';
import { openAdminFile } from '@/lib/adminFiles.js';
<<<<<<< HEAD

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

  const refresh = useCallback(async () => {
    try {
      const result = await adminRequest(`/admin/invoices${bookingFilter ? `?booking=${encodeURIComponent(bookingFilter)}` : ''}`);
      setInvoices(result.data?.items || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load invoice history.');
    }
  }, [bookingFilter]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    const reload = () => refresh();
    for (const event of ['gate-in:updated','gate-in:queue-updated','gate-out:updated','notification:new','connect']) adminSocket.on(event, reload);
    return () => { for (const event of ['gate-in:updated','gate-in:queue-updated','gate-out:updated','notification:new','connect']) adminSocket.off(event, reload); };
  }, [refresh]);

  const showDetails = async id => {
    setLoadingDetails(true);setError('');
    try {
      const result = await adminRequest(`/admin/invoices/${id}`);
      setDetails(result.data || null);
    } catch (err) {
      setError(err.message || 'Unable to load invoice details.');
    } finally { setLoadingDetails(false); }
  };

  const shown = useMemo(() => invoices
    .filter(invoice => filter === 'ALL' || invoice.type === filter || invoice.status === filter)
    .filter(invoice => `${invoice.number} ${invoice.company?.companyName || ''} ${invoice.type || ''}`.toLowerCase().includes(query.toLowerCase().trim())), [invoices, filter, query]);
  const download = path => openAdminFile(path, true).catch(err => setError(err.message));

  return <div className="space-y-5">
    <header>
      <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Payments & Transactions</p>
      <h1 className="mt-1 text-2xl font-extrabold">Invoices & Payment History</h1>
      <p className="mt-1 text-sm text-muted-foreground">View invoice balances, payment attempts, receipt documents, and manual billing charges. Gate-in payment approval is now completed inside Gate-in Processing.</p>
    </header>
    <section className="grid gap-3 sm:grid-cols-3">
      {[
        ['Awaiting payment review', invoices.filter(i => i.type === 'GATE_IN' && i.status === 'PAYMENT_SUBMITTED').length, Clock3],
        ['Unpaid invoices', invoices.filter(i => i.status === 'UNPAID').length, FileText],
        ['Paid invoices', invoices.filter(i => i.status === 'PAID').length, CheckCircle2],
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
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-extrabold">Invoice records</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className="h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm" placeholder="Invoice or company" aria-label="Search invoices" value={query} onChange={event => setQuery(event.target.value)}/></div>
          <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" aria-label="Invoice filter" value={filter} onChange={event => setFilter(event.target.value)}>{[['ALL','All'],['GATE_IN','Gate-in'],['GATE_OUT','Gate-out'],['UNPAID','Unpaid'],['PAYMENT_SUBMITTED','Under verification'],['PAID','Paid']].map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select>
        </div>
      </div>
      {bookingFilter && <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-sky-50 p-3 text-xs font-semibold text-sky-900"><span>Showing invoices linked to a selected booking.</span><Link to="/invoice-review" className="text-primary underline underline-offset-4">Clear booking filter</Link></div>}
      {loading ? <div className="p-5"><div className="h-40 animate-pulse rounded-xl bg-muted"/></div> : shown.length ? <div className="divide-y divide-border">{shown.map(invoice => <div key={invoice._id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <div className="min-w-0"><strong>{invoice.number}</strong><p className="mt-1 text-xs text-muted-foreground">{invoice.company?.companyName || 'Client'} · {pretty(invoice.type)}</p></div>
        <strong>{peso(invoice.total)}</strong>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge(invoice.status)}`}>{pretty(invoice.status)}</span>
        <div className="flex flex-wrap gap-3">
          {invoice.type === 'GATE_IN' && invoice.status === 'UNPAID' && can(MODULES.GATE_IN,ACTIONS.PROCESS) && <button type="button" className="font-bold text-primary underline" onClick={() => setOptionalInvoice(invoice._id)}>Add booking transaction</button>}
          <button type="button" className="font-bold text-primary underline" onClick={() => showDetails(invoice._id)}>View history</button>
          <button type="button" className="font-bold text-primary underline" onClick={() => download(`/admin/invoices/${invoice._id}/pdf`)}>Invoice PDF</button>
          {invoice.status === 'PAID' && <button type="button" className="font-bold text-primary underline" onClick={() => download(`/admin/invoices/${invoice._id}/receipt`)}>Receipt PDF</button>}
        </div>
      </div>)}</div> : <div className="p-12 text-center text-sm text-muted-foreground">No invoices match your filters.</div>}
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
    {optionalInvoice && <OptionalChargesModal invoiceId={optionalInvoice} onClose={() => setOptionalInvoice(null)} onSaved={() => {setOptionalInvoice(null);refresh();}}/>}
  </div>;
=======
const peso=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0));
const pretty=value=>String(value||'').replaceAll('_',' ')||'—';
const badge=status=>status==='PAID'?'bg-emerald-100 text-emerald-700':status==='PAYMENT_SUBMITTED'?'bg-sky-100 text-sky-700':status==='UNPAID'?'bg-amber-100 text-amber-800':'bg-muted text-foreground';

export default function InvoiceReviewPage(){
 const {can}=useAuth();
 const [searchParams] = useSearchParams();
 const bookingFilter = searchParams.get('booking');
 const [optionalInvoice,setOptionalInvoice]=useState(null);
 const [invoices,setInvoices]=useState([]),[payments,setPayments]=useState([]),[selected,setSelected]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [query,setQuery]=useState(''),[filter,setFilter]=useState('ALL');
 const canVerify=can(MODULES.GATE_IN,ACTIONS.PROCESS);
 const refresh=useCallback(async()=>{
   const requests=[adminRequest(`/admin/invoices${bookingFilter ? `?booking=${encodeURIComponent(bookingFilter)}` : ''}`)];
   if(canVerify)requests.push(adminRequest('/admin/invoices/pending-payments'));
   const results=await Promise.allSettled(requests);
   if(results[0].status==='fulfilled')setInvoices(results[0].value?.data?.items||[]);
   else setError(results[0].reason?.message||'Unable to load invoices.');
   if(canVerify){if(results[1].status==='fulfilled')setPayments(results[1].value?.data?.items||[]);else setError(results[1].reason?.message||'Unable to load pending Gate-in payment verification.');}
 },[canVerify,bookingFilter]);
 useEffect(()=>{let active=true;setLoading(true);refresh().finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[refresh]);
 useEffect(()=>{
   const reload=()=>refresh().catch(()=>{});
   for(const event of ['gate-in:updated','gate-in:queue-updated','notification:new','connect'])adminSocket.on(event,reload);
   return()=>{for(const event of ['gate-in:updated','gate-in:queue-updated','notification:new','connect'])adminSocket.off(event,reload);};
 },[refresh]);
 const review=async decision=>{
   if(!selected||!canVerify)return;
   if(decision==='REJECT'&&!reason.trim()){setError('Rejection reason is required.');return;}
   setBusy(true);setError('');setNotice('');try{
     await adminRequest(`/admin/invoices/payments/${selected._id}/review`,{method:'POST',body:JSON.stringify({decision,reason})});
     setSelected(null);setReason('');setNotice(decision==='APPROVE'?'Gate-in payment verified. Gate-in inspection and physical entry remain separate.':'Payment rejected. The client can resubmit evidence from their invoice.');await refresh();
   }catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const shown=useMemo(()=>invoices.filter(i=>filter==='ALL'||i.type===filter||i.status===filter).filter(i=>`${i.number} ${i.company?.companyName||''} ${i.type||''}`.toLowerCase().includes(query.toLowerCase().trim())),[invoices,filter,query]);
 const download=path=>openAdminFile(path,true).catch(e=>setError(e.message));
 return <div className="space-y-5">
  <header><p className="text-xs font-extrabold uppercase tracking-widest text-primary">Payments & Transactions</p><h1 className="mt-1 text-2xl font-extrabold">Invoices & Payment Verification</h1><p className="mt-1 text-sm text-muted-foreground">Review client evidence and verify Gate-in payments. For unpaid Gate-in bookings, select Add booking transaction to include configured Documentation Fee or other optional charges before payment. Gate-out payment approval remains in the Gate-out module.</p></header>
  <section className="grid gap-3 sm:grid-cols-3">{[["Gate-in payments to review",payments.length,Clock3],["Unpaid invoices",invoices.filter(i=>i.status==='UNPAID').length,FileText],["Paid invoices",invoices.filter(i=>i.status==='PAID').length,CheckCircle2]].map(([title,value,Icon])=><div key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span><div><strong className="text-2xl font-extrabold">{value}</strong><p className="text-xs font-bold text-muted-foreground">{title}</p></div></div>)}</section>
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><div><strong>Keep the stages separate.</strong><p className="mt-1">Verified Gate-in payment permits inspection, not automatic physical entry. Gate-out approval and physical release are also separate.</p></div><Link to="/gate-out" className="inline-flex items-center gap-1 text-xs font-bold text-primary">Gate-out review <ArrowRight size={15}/></Link></div>
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
  <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-extrabold">Gate-in · Pending Verification ({canVerify?payments.length:'Restricted'})</h2>{!canVerify&&<span className="text-xs text-amber-700">Gate-in PROCESS permission required</span>}</div>
   {!canVerify?<p className="mt-4 rounded-xl bg-muted p-4 text-sm text-muted-foreground">You can view invoices, but payment approval is restricted to authorized Gate-in processing staff.</p>:loading?<div className="mt-4 space-y-3">{[0,1,2].map(i=><div key={i} className="h-20 animate-pulse rounded-lg bg-muted"/>)}</div>:payments.length===0?<div className="mt-4 rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">No Gate-in payments awaiting verification.</div>:<div className="mt-4 space-y-2">{payments.map(p=><div key={p._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700"><CreditCard size={17}/></span><div><strong className="text-sm">{p.invoice?.number||'Invoice'}</strong><p className="mt-1 text-xs text-muted-foreground">{p.company?.companyName||'Client'} · {p.method} · {p.reference||'Proof only (no reference)'}</p><p className="mt-1 text-sm font-bold">{peso(p.amount)}</p></div></div><button type="button" disabled={busy} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50" onClick={()=>{setSelected(p);setReason('');setError('')}}>Review evidence</button></div>)}</div>}
   {selected&&<section className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4" aria-label="Review Gate-in payment"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase text-primary">Gate-in payment review</p><h3 className="mt-1 text-lg font-extrabold">{selected.invoice?.number}</h3><p className="text-sm text-muted-foreground">{selected.reference||'Reference not supplied — verify uploaded proof'} · {peso(selected.amount)}</p></div><button type="button" className="rounded-lg border border-input bg-card px-3 py-2 text-xs font-bold" onClick={()=>setSelected(null)}>Close</button></div>
    {selected.receivingAccount?.accountNumber&&<p className="mt-3 rounded-xl border border-border bg-card p-3 text-sm"><strong>Receiving account:</strong> {selected.receivingAccount.bankName} · {selected.receivingAccount.accountName} · {selected.receivingAccount.accountNumber}</p>}
    <div className="mt-3">{selected.proof?.storedName?<button className="text-sm font-bold text-primary underline" type="button" onClick={()=>openAdminFile(`/admin/invoices/payments/${selected._id}/proof`).catch(e=>setError(e.message))}>View submitted proof</button>:<p className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><ShieldAlert size={16}/>No proof document. Verify the reference against receiving account records before approving.</p>}</div>
    <label className="mt-4 block text-sm font-bold">Reason if rejected (required for rejection)<textarea value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm" maxLength={800} placeholder="Clearly explain what the client needs to correct"/></label>
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>review('APPROVE')} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Verify Gate-in Payment</button><button type="button" disabled={busy||!reason.trim()} onClick={()=>review('REJECT')} className="rounded-lg border border-red-300 bg-card px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">Reject Payment</button></div>
   </section>}
  </section>
  <section className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-extrabold">Invoice records</h2><div className="flex flex-wrap gap-2"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className="h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm" placeholder="Invoice or company" aria-label="Search invoices" value={query} onChange={e=>setQuery(e.target.value)}/></div><select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" aria-label="Invoice filter" value={filter} onChange={e=>setFilter(e.target.value)}>{[['ALL','All'],['GATE_IN','Gate-in'],['GATE_OUT','Gate-out'],['UNPAID','Unpaid'],['PAYMENT_SUBMITTED','Under verification'],['PAID','Paid']].map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></div></div>
   {bookingFilter&&<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-sky-50 p-3 text-xs font-semibold text-sky-900"><span>Showing invoices linked to selected booking. Add configured manual charges before payment submission.</span><Link to="/invoice-review" className="text-primary underline underline-offset-4">Clear booking filter</Link></div>}
   {loading?<div className="p-5"><div className="h-40 animate-pulse rounded-xl bg-muted"/></div>:shown.length?<div className="divide-y divide-border">{shown.map(i=><div key={i._id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"><div className="min-w-0"><strong>{i.number}</strong><p className="mt-1 text-xs text-muted-foreground">{i.company?.companyName||'Client'} · {pretty(i.type)}</p></div><strong>{peso(i.total)}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge(i.status)}`}>{pretty(i.status)}</span><div className="flex flex-wrap gap-3">{i.type==='GATE_IN'&&i.status==='UNPAID'&&can(MODULES.GATE_IN,ACTIONS.PROCESS)&&<button type="button" className="font-bold text-primary underline" onClick={()=>setOptionalInvoice(i._id)}>Add booking transaction</button>}<button type="button" className="font-bold text-primary underline" onClick={()=>download(`/admin/invoices/${i._id}/pdf`)}>Invoice PDF</button>{i.status==='PAID'&&<button type="button" className="font-bold text-primary underline" onClick={()=>download(`/admin/invoices/${i._id}/receipt`)}>Receipt PDF</button>}</div></div>)}</div>:<div className="p-12 text-center text-sm text-muted-foreground">No invoices match your filters.</div>}
  </section>
  {optionalInvoice&&<OptionalChargesModal invoiceId={optionalInvoice} onClose={()=>setOptionalInvoice(null)} onSaved={refresh}/>}
 </div>;
>>>>>>> eb1edb6baa48f1692cec002aa79d5d90f406662b
}
