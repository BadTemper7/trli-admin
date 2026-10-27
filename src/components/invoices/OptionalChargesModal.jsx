import {useEffect,useMemo,useState} from 'react';
import {CheckCircle2,FilePlus2,X} from 'lucide-react';
import {adminRequest} from '@/lib/adminApi.js';
import {Button} from '@/components/ui/button.jsx';

const peso = n => new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0));
/** Only unpaid Gate-in invoices can be edited. No free-form prices are accepted. */
export default function OptionalChargesModal({invoiceId,onClose,onSaved}){
  const [data,setData]=useState(null);
  const [selected,setSelected]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    let alive=true;
    setLoading(true);setError('');
    adminRequest(`/admin/invoices/${invoiceId}/optional-charges`)
      .then(r=>{if(alive){setData(r.data);setSelected(r.data.selectedRateIds||[]);}})
      .catch(e=>{if(alive)setError(e.message);})
      .finally(()=>{if(alive)setLoading(false);});
    return ()=>{alive=false;};
  },[invoiceId]);
  const estimatedAdditions=useMemo(()=>data?.available?.filter(r=>selected.includes(r.id)).reduce((sum,r)=>sum+Number(r.amount||0),0)||0,[data,selected]);
  const save=async()=>{
    setBusy(true);setError('');
    try{
      const r=await adminRequest(`/admin/invoices/${invoiceId}/optional-charges`,{method:'PUT',body:JSON.stringify({rateIds:selected})});
      await onSaved?.(r.data.invoice);
      onClose();
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-3" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
    <section role="dialog" aria-modal="true" aria-label="Add manual booking transaction" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b p-5"><div><h2 className="flex items-center gap-2 text-lg font-bold"><FilePlus2 size={20}/> Add Manual Booking Transaction</h2><p className="mt-1 text-xs text-slate-600">Add a configured Documentation Fee or another optional service to this booking before the client pays. Rates, VAT, and invoice totals are calculated on the server.</p></div><button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg border p-2"><X size={17}/></button></div>
      <div className="space-y-3 p-5">
        {loading?<div className="space-y-3">{[1,2,3].map(n=><div key={n} className="h-12 animate-pulse rounded-lg bg-slate-100"/>)}</div>:data?.available?.length?data.available.map(rate=><label key={rate.id} className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 hover:bg-slate-50"><span className="flex gap-3"><input type="checkbox" className="mt-1 size-4" checked={selected.includes(rate.id)} disabled={busy||!data.editable} onChange={e=>setSelected(curr=>e.target.checked?[...curr,rate.id]:curr.filter(id=>id!==rate.id))}/><span className="text-sm"><strong>{rate.name}</strong>{rate.description&&<span className="mt-0.5 block text-xs text-slate-500">{rate.description}</span>}</span></span><strong className="whitespace-nowrap text-sm">{peso(rate.amount)}</strong></label>):!loading&&<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No optional services configured. Go to Rate Setup and create an active Documentation Fee or Other rate with Billing Application set to Optional and Collect At set to Gate-in.</p>}
        {data&&<div className="rounded-xl border bg-slate-50 p-4 text-sm"><p>Invoice <strong>{data.invoice.number}</strong></p><p>Existing total: <strong>{peso(data.invoice.total)}</strong></p><p>Selected manual charges: <strong>{peso(estimatedAdditions)}</strong></p><p className="mt-2 text-xs text-slate-600">Only configured optional rates can be added. This updates the existing unpaid Gate-in invoice; it does not record a payment or issue a separate invoice. Fixed charges remain unchanged.</p></div>}
        {!data?.editable&&data&&<p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">This invoice has an existing payment submission and can no longer be modified here.</p>}
        {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t p-5"><Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={save} disabled={loading||busy||!data?.editable}><CheckCircle2 size={16}/>{busy?'Saving...':'Add Charges & Update Invoice'}</Button></div>
    </section>
  </div>;
}
