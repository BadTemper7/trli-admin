import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'

const RATE_NAMES = [
  'Gate-in Handling',
  'Gate-out Handling',
  'Shifting Fee',
  'Documentation Fee',
  'Overtime',
  'Lift On',
  'Lift Off',
  'Storage',
  'Congestion Surcharge',
  'Other',
]

const AUTO_NAMES = new Set(['Gate-in Handling','Gate-out Handling','Shifting Fee','Overtime','Lift On','Lift Off','Storage'])
const OPTIONAL_NAMES = new Set(['Documentation Fee','Other'])
const GATE_IN_ONLY = new Set(['Gate-in Handling','Shifting Fee','Documentation Fee'])
const GATE_OUT_ONLY = new Set(['Gate-out Handling','Storage'])
const initial={billingMode:'AUTOMATIC',name:'',classification:'',containerCategory:'STANDARD',taxTreatment:'TAXABLE',loadStatus:'',containerSize:'ALL',amount:'',collectionPoint:'',status:'ACTIVE',description:'',effectiveFrom:''}

export default function RateFormModal({open,rate,onClose,onSubmit,busy}){
  const [form,setForm]=useState(initial)
  const [error,setError]=useState('')
  useEffect(()=>{
    if(!open)return
    setForm(rate?{billingMode:rate.billingMode||(AUTO_NAMES.has(rate.name)?'AUTOMATIC':'OPTIONAL'),name:rate.name||'',classification:rate.classification||'',containerCategory:rate.containerCategory||'STANDARD',taxTreatment:rate.taxTreatment||'TAXABLE',loadStatus:rate.loadStatus||'',containerSize:rate.containerSize||'ALL',amount:String(rate.amount??''),collectionPoint:rate.collectionPoint||'',status:rate.status||'ACTIVE',description:rate.description||'',effectiveFrom:rate.effectiveFrom?new Date(rate.effectiveFrom).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'}):''}:initial)
    setError('')
  },[open,rate])
  if(!open)return null
  const isOvertime=form.name==='Overtime'
  const set=(key,value)=>setForm(prev=>({...prev,[key]:value}))
  const changeName = name => setForm(prev => ({
    ...prev, name,
    billingMode: AUTO_NAMES.has(name) ? 'AUTOMATIC' : 'OPTIONAL',
    classification: name === 'Overtime' ? 'ALL' : (prev.classification === 'ALL' ? '' : prev.classification),
    containerCategory: name === 'Overtime' ? 'ALL' : (prev.containerCategory === 'ALL' ? 'STANDARD' : prev.containerCategory),
    loadStatus: name === 'Overtime' ? 'ALL' : (prev.loadStatus === 'ALL' ? '' : prev.loadStatus),
    containerSize: name === 'Overtime' ? 'ALL' : prev.containerSize,
    collectionPoint: name === 'Overtime' ? 'BOTH' : GATE_IN_ONLY.has(name) ? 'GATE_IN' : GATE_OUT_ONLY.has(name) ? 'GATE_OUT' : (prev.collectionPoint === 'BOTH' ? '' : prev.collectionPoint),
  }))
  const submit=async(e)=>{
    e.preventDefault()
    if(!RATE_NAMES.includes(form.name))return setError('Select a valid rate name.')
    if(!form.classification)return setError('Select the rate classification or All for overtime.')
    if(!form.loadStatus)return setError('Select the load status or All for overtime.')
    if(form.containerCategory==='REEFER'&&form.loadStatus==='LOADED')return setError('Reefer Loaded rates are not supported.')
    if(!form.collectionPoint)return setError('Select where payment will be collected.')
    if(!isOvertime && [form.classification,form.containerCategory,form.loadStatus].includes('ALL')) return setError('All classifications and load statuses are reserved for Overtime.')
    if(!isOvertime && form.collectionPoint==='BOTH') return setError('Both collection points are reserved for Overtime.')
    const amount=Number(form.amount)
    if(!Number.isFinite(amount)||amount<=0)return setError('Rate amount must be greater than zero.')
    try{await onSubmit({...form,amount})}catch(err){setError(err.message||'Unable to save rate.')}
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div><h2 className="text-lg font-bold">{rate?'Edit Rate':'Add Rate'}</h2><p className="text-sm text-muted-foreground">Define when this charge applies and where payment is collected.</p></div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5"/></button>
      </div>
      <div className="grid gap-5 p-6 md:grid-cols-2">
        {isOvertime && <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          <strong>Overtime · automatic during configured OT hours (default 6:00 PM–8:00 AM)</strong><br/>
          Set <strong>All</strong> and <strong>Gate-in &amp; Gate-out</strong> for one universal rate. To customize a category, create an additional Overtime rate with specific classification, container type, load status or size. The most specific matching rate is used, without double charging.
        </div>}
        <label className="space-y-1.5 md:col-span-2"><span className="text-sm font-semibold">Rate Name *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.name} onChange={e=>changeName(e.target.value)}><option value="">Select rate name</option>{RATE_NAMES.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Transaction Classification *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.classification} onChange={e=>set('classification',e.target.value)}><option value="">Select classification</option>{isOvertime && <option value="ALL">All classifications</option>}<option value="LOCAL">Local</option><option value="INTERNATIONAL">International</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Container Category *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.containerCategory} onChange={e=>{set('containerCategory',e.target.value);if(e.target.value==='REEFER')setForm(v=>({...v,containerCategory:'REEFER',loadStatus:'EMPTY'}))}}>{isOvertime && <option value="ALL">All container categories</option>}<option value="STANDARD">Standard / Non-reefer</option><option value="REEFER">Reefer (Empty only)</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Tax Treatment</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.taxTreatment} onChange={e=>set('taxTreatment',e.target.value)}><option value="TAXABLE">VAT taxable</option><option value="EXEMPT">VAT exempt</option><option value="ZERO_RATED">Zero rated</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Load Status *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.loadStatus} onChange={e=>set('loadStatus',e.target.value)}><option value="">Select load status</option>{isOvertime && <option value="ALL">All load statuses</option>}<option value="EMPTY">Empty</option><option value="LOADED" disabled={form.containerCategory==='REEFER'}>Loaded</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Container Size</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.containerSize} onChange={e=>set('containerSize',e.target.value)}><option value="ALL">All Sizes</option><option value="20FT">20FT</option><option value="40FT">40FT</option></select><span className="text-xs text-muted-foreground">Use All Sizes when the same amount applies to both 20FT and 40FT.</span></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Rate Amount (PHP) *</span><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0.00"/></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Collect Payment At *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.collectionPoint} disabled={GATE_IN_ONLY.has(form.name)||GATE_OUT_ONLY.has(form.name)} onChange={e=>set('collectionPoint',e.target.value)}><option value="">Select collection point</option>{isOvertime && <option value="BOTH">Gate-in &amp; Gate-out (both)</option>}<option value="GATE_IN">Gate-in</option><option value="GATE_OUT">Gate-out</option></select><span className="text-xs text-muted-foreground">{isOvertime?'Both collects overtime on each eligible entry or exit; select an individual gate for a gate-specific override.':'This determines when the charge should be collected in the container workflow.'}</span></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Billing Application *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={AUTO_NAMES.has(form.name)?'AUTOMATIC':OPTIONAL_NAMES.has(form.name)?'OPTIONAL':form.billingMode} disabled={AUTO_NAMES.has(form.name)||OPTIONAL_NAMES.has(form.name)} onChange={e=>set('billingMode',e.target.value)}><option value="AUTOMATIC">Fixed / Automatically include</option><option value="OPTIONAL">Optional / Manually add</option></select><span className="text-xs text-muted-foreground">Lift On, Lift Off, Storage and Shifting are fixed. Documentation is optional by default. Overtime is always automatic during the configured overnight window for Gate-in and Gate-out.</span></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Status *</span><select className="h-10 w-full rounded-lg border bg-white px-3 text-sm" value={form.status} onChange={e=>set('status',e.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        <label className="space-y-1.5"><span className="text-sm font-semibold">Effective from (optional)</span><Input type="date" value={form.effectiveFrom} onChange={e=>set('effectiveFrom',e.target.value)}/><span className="text-xs text-muted-foreground">Future rates are hidden from active Client Rates and billing until this date.</span></label>
        <label className="space-y-1.5 md:col-span-2"><span className="text-sm font-semibold">Description</span><textarea className="min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-primary" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Optional internal note about this rate."/></label>
        {error&&<div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
      <div className="flex justify-end gap-2 border-t px-6 py-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{busy?'Saving...':rate?'Save Changes':'Create Rate'}</Button></div>
    </form>
  </div>
}
