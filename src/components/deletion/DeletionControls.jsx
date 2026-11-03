import {useState} from 'react';
import {EllipsisVertical,Eye,Edit3,Trash2,CheckSquare,X} from 'lucide-react';
import {adminRequest} from '@/lib/adminApi.js';
import {useAuth} from '@/context/AuthContext.jsx';
import {ACTIONS} from '@/constants/permissions.js';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuSeparator} from '@/components/ui/dropdown-menu.jsx';

export function useBulkDeletion(module,{target='',onDeleted=()=>{}}={}) {
  const {can}=useAuth();
  const allowed=Boolean(module&&can(module,ACTIONS.DELETE));
  const [selected,setSelected]=useState([]);
  const [pending,setPending]=useState([]);
  const [reason,setReason]=useState('');
  const [confirmation,setConfirmation]=useState('');
  const [purgeFinancial,setPurgeFinancial]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const toggle=(id,checked)=>setSelected(ids=>checked?[...new Set([...ids,String(id)])]:ids.filter(x=>x!==String(id)));
  const all=(ids,checked)=>setSelected(checked?ids.map(String):[]);
  const clear=()=>{setPending([]);setReason('');setConfirmation('');setPurgeFinancial(false);setError('')};
  const ask=(ids)=>{if(!allowed)return;setPending(ids.map(String));setReason('');setConfirmation('');setPurgeFinancial(false);setError('')};
  const execute=async()=>{
    if(!allowed||!pending.length||busy)return;
    setBusy(true);setError('');
    try{
      const response=await adminRequest('/admin/records/delete',{method:'POST',body:JSON.stringify({module,target,ids:pending,confirmation,reason,purgeFinancial})});
      setSelected([]);clear();setNotice(response.message||'Records deleted.');
      try { await onDeleted(); } catch { setNotice('Records were deleted and audited, but the table refresh failed. Reload this page to see the changes.'); }
    }catch(e){setError(e.message||'Deletion failed; no records were removed.')}finally{setBusy(false)}
  };
  return {allowed,selected,toggle,all,ask,clear,execute,pending,reason,setReason,confirmation,setConfirmation,purgeFinancial,setPurgeFinancial,busy,error,notice,setNotice};
}

export function RowActions({items=[],onView,onEdit,onDelete,canDelete=false,disabled=false,ariaLabel='Record actions'}) {
  const actions=items.length?items:[...(onView?[{label:'View details',onClick:onView,icon:Eye}]:[]),...(onEdit?[{label:'Edit',onClick:onEdit,icon:Edit3}]:[])];
  return <DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={ariaLabel} title={ariaLabel} disabled={disabled} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><EllipsisVertical size={18}/></button></DropdownMenuTrigger><DropdownMenuContent align="end" sideOffset={5} className="z-[90]">
   {actions.map((a,i)=><DropdownMenuItem key={`${a.label}-${i}`} disabled={a.disabled} onSelect={a.onClick}><span>{a.icon?<a.icon size={16}/>:<Eye size={16}/>}</span>{a.label}</DropdownMenuItem>)}
   {canDelete&&onDelete&&<>{actions.length>0&&<DropdownMenuSeparator/>}<DropdownMenuItem destructive onSelect={onDelete}><Trash2 size={16}/>Delete record</DropdownMenuItem></>}
  </DropdownMenuContent></DropdownMenu>;
}

export function SelectRecord({checked,onChange,label='Select record',disabled=false}) {return <input type="checkbox" disabled={disabled} aria-label={label} checked={Boolean(checked)} onChange={event=>onChange(event.target.checked)} className="size-4 cursor-pointer accent-red-700"/>;}
export function BulkDeleteToolbar({control,ids=[]}) {
  if(!control?.allowed)return null;
  const every=ids.length>0&&ids.every(id=>control.selected.includes(String(id)));
  return <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm"><label className="inline-flex items-center gap-2 font-semibold"><SelectRecord label="Select all visible records" checked={every} onChange={c=>control.all(ids,c)}/> Select page ({ids.length})</label><span className="text-slate-500">{control.selected.length} selected</span><button type="button" disabled={!control.selected.length} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-40" onClick={()=>control.ask(control.selected)}><Trash2 size={15}/>Delete selected ({control.selected.length})</button>{!!control.selected.length&&<button type="button" className="text-xs underline" onClick={()=>control.all([],false)}>Clear</button>}</div>;
}
export function DeletionFeedback({control}) {return <>{control?.notice&&<div role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{control.notice}<button className="ml-3 underline" onClick={()=>control.setNotice('')}>Dismiss</button></div>}</>}
export function DeletionDialog({control,description=''}){
  if(!control?.pending?.length)return null;
  const count=control.pending.length,phrase=`DELETE ${count}`;
  return <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-slate-950/60 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-label="Confirm deletion" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-red-700">Delete {count} record{count===1?'':'s'}?</h2><button type="button" onClick={control.clear} disabled={control.busy} aria-label="Close"><X size={20}/></button></div><p className="mt-3 text-sm text-slate-700">This permanently removes selected records and their linked operational data. Deleting a booking also deletes its invoices and payments; deleting an invoice with a live booking also removes the linked container. The Audit Logs entry is retained. This action cannot be undone.</p>{description&&<p className="mt-2 text-sm text-slate-600">{description}</p>}<label className="mt-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"><input type="checkbox" className="mt-1 size-4 accent-red-700" checked={control.purgeFinancial} onChange={e=>control.setPurgeFinancial(e.target.checked)}/><span><strong>Financial records:</strong> I authorize permanent deletion of any related paid invoices, verified payment submissions, receipt references, and linked container records. This requires sufficient Delete permissions and will be written to Audit Logs.</span></label><label className="mt-5 block text-sm font-semibold">Reason for deletion (recorded in Audit Logs)<textarea required minLength={8} rows={3} className="mt-2 w-full rounded-lg border p-3 text-sm" value={control.reason} onChange={e=>control.setReason(e.target.value)} placeholder="Example: Removing test booking data from staging"/></label><label className="mt-4 block text-sm font-semibold">Type <strong className="text-red-700">{phrase}</strong> to confirm<input className="mt-2 w-full rounded-lg border p-3 font-mono text-sm" autoComplete="off" value={control.confirmation} onChange={e=>control.setConfirmation(e.target.value)}/></label>{control.error&&<p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{control.error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" className="rounded-lg border px-4 py-2" disabled={control.busy} onClick={control.clear}>Cancel</button><button type="button" className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white disabled:opacity-50" onClick={control.execute} disabled={control.busy||control.confirmation!==phrase||control.reason.trim().length<8}>{control.busy?'Deleting...':`Delete ${count}`}</button></div></section></div>;
}
