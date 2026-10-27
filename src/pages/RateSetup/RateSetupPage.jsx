import { CircleDollarSign, CreditCard, MapPin, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import RateFormModal from '@/components/rates/RateFormModal.jsx'
import { Button } from '@/components/ui/button.jsx'
import TableSkeleton from '@/components/ui/TableSkeleton.jsx'
import { Input } from '@/components/ui/input.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { ACTIONS, MODULES } from '@/constants/permissions.js'
import { clearLegacyLocalRates, getLegacyLocalRates, rateApi } from '@/lib/rateApi.js'
import { adminSocket } from '@/lib/adminSocket.js'

const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 })
const titleCase = (value) => String(value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase())

function Stat({ icon: Icon, label, value, sub }) {
  return <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-primary"><Icon className="h-5 w-5" /></span><div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-2xl font-black">{value}</div>{sub && <div className="text-xs text-muted-foreground">{sub}</div>}</div></div></div>
}

function Badge({ children, tone = 'slate' }) {
  const tones = { slate: 'bg-slate-100 text-slate-700', blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>
}

export default function RateSetupPage() {
  const { can } = useAuth()
  const [rates, setRates] = useState([])
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [rateName, setRateName] = useState('')
  const [classification, setClassification] = useState('')
  const [loadStatus, setLoadStatus] = useState('')
  const [collectionPoint, setCollectionPoint] = useState('')
  const [status, setStatus] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const initializedRef = useRef(false)
  const listRequestRef = useRef(null)

  const loadRates = useCallback(async () => {
    if (listRequestRef.current) return listRequestRef.current

    setLoading(true)
    setError('')
    const request = rateApi.list()
      .then((result) => {
        setRates(result.data || [])
        return result.data || []
      })
      .catch((err) => {
        setError(err.message || 'Unable to load rates.')
        throw err
      })
      .finally(() => {
        listRequestRef.current = null
        setLoading(false)
      })

    listRequestRef.current = request
    return request
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let cancelled = false
    ;(async () => {
      try {
        const legacy = getLegacyLocalRates()
        if (legacy.length && can(MODULES.RATE_SETUP, ACTIONS.CREATE)) {
          const result = await rateApi.importLocal(legacy)
          clearLegacyLocalRates()
          if (!cancelled && result.data?.imported) {
            setNotice(`${result.data.imported} existing rate${result.data.imported === 1 ? '' : 's'} imported successfully.`)
          }
        }
      } catch (err) {
        if (!cancelled) setError(`Existing rate import failed: ${err.message}`)
      }

      if (!cancelled) {
        try { await loadRates() } catch { /* error already displayed */ }
      }
    })()

    return () => { cancelled = true }
  }, [can, loadRates])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const upsert = (rate) => {
      if (!rate?.id) return
      setRates((current) => {
        const exists = current.some((item) => item.id === rate.id)
        return exists
          ? current.map((item) => item.id === rate.id ? rate : item)
          : [rate, ...current]
      })
    }
    const remove = ({ id } = {}) => {
      if (!id) return
      setRates((current) => current.filter((item) => item.id !== id))
    }
    const handleBulkImport = () => { loadRates().catch(() => {}) }

    adminSocket.on('rate:created', upsert)
    adminSocket.on('rate:updated', upsert)
    adminSocket.on('rate:deleted', remove)
    adminSocket.on('rate:bulk-imported', handleBulkImport)

    return () => {
      adminSocket.off('rate:created', upsert)
      adminSocket.off('rate:updated', upsert)
      adminSocket.off('rate:deleted', remove)
      adminSocket.off('rate:bulk-imported', handleBulkImport)
    }
  }, [loadRates])

  const filtered = useMemo(() => rates.filter((rate) => {
    const haystack = `${rate.name} ${rate.description}`.toLowerCase()
    return (!query || haystack.includes(query.toLowerCase()))
      && (!rateName || rate.name === rateName)
      && (!classification || rate.classification === classification || (rate.name === 'Overtime' && rate.classification === 'ALL'))
      && (!loadStatus || rate.loadStatus === loadStatus || (rate.name === 'Overtime' && rate.loadStatus === 'ALL'))
      && (!collectionPoint || rate.collectionPoint === collectionPoint || (rate.name === 'Overtime' && rate.collectionPoint === 'BOTH' && collectionPoint !== 'BOTH'))
      && (!status || rate.status === status)
  }), [rates, query, rateName, classification, loadStatus, collectionPoint, status])

  const active = rates.filter((rate) => rate.status === 'ACTIVE')
  const gateIn = active.filter((rate) => ['GATE_IN','BOTH'].includes(rate.collectionPoint)).length
  const gateOut = active.filter((rate) => ['GATE_OUT','BOTH'].includes(rate.collectionPoint)).length
  const local = active.filter((rate) => rate.classification === 'LOCAL').length
  const international = active.filter((rate) => rate.classification === 'INTERNATIONAL').length

  const save = async (data) => {
    setBusy(true)
    setError('')
    try {
      const response = modal?.id ? await rateApi.update(modal.id, data) : await rateApi.create(data)
      const saved = response.data
      if (saved?.id) {
        setRates((current) => {
          const exists = current.some((item) => item.id === saved.id)
          return exists
            ? current.map((item) => item.id === saved.id ? saved : item)
            : [saved, ...current]
        })
      }
      setModal(null)
      setNotice(modal?.id ? 'Rate updated successfully.' : 'Rate created successfully.')
    } catch (err) {
      setError(err.message || 'Unable to save rate.')
      throw err
    } finally {
      setBusy(false)
    }
  }

  const remove = async (rate) => {
    if (!window.confirm(`Delete rate “${rate.name}”?`)) return
    setBusy(true)
    setError('')
    try {
      await rateApi.delete(rate.id)
      setRates((current) => current.filter((item) => item.id !== rate.id))
      setNotice('Rate deleted successfully.')
    } catch (err) {
      setError(err.message || 'Unable to delete rate.')
    } finally {
      setBusy(false)
    }
  }

  return <PageContainer className="max-w-[1800px]">
    <PageHeader title="Rate Setup" description="Configure active fees by container category. Overtime can cover all classifications, sizes and load statuses at both Gate-in and Gate-out, with editable category-specific overrides." actions={can(MODULES.RATE_SETUP, ACTIONS.CREATE) ? <Button onClick={() => setModal({})}><Plus className="h-4 w-4" />Add Rate</Button> : null} />
    {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
    {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={CircleDollarSign} label="Active Rates" value={active.length} sub={`${local} local / ${international} international`} />
      <Stat icon={CreditCard} label="Gate-in Collection" value={gateIn} sub="Active charges collected at entry" />
      <Stat icon={MapPin} label="Gate-out Collection" value={gateOut} sub="Active charges collected at exit" />
      <Stat icon={SlidersHorizontal} label="Configured Rules" value={rates.length} sub={`${rates.length - active.length} inactive`} />
    </div>

    <div className="mb-5 rounded-2xl border bg-white p-4 shadow-sm"><div className="flex flex-wrap gap-3">
      <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rates..." /></div>
      <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={rateName} onChange={(event) => setRateName(event.target.value)}><option value="">All Rate Names</option><option value="Gate-in Handling">Gate-in Handling</option><option value="Gate-out Handling">Gate-out Handling</option><option value="Shifting Fee">Shifting Fee</option><option value="Documentation Fee">Documentation Fee</option><option value="Overtime">Overtime</option><option value="Lift On">Lift On</option><option value="Lift Off">Lift Off</option><option value="Storage">Storage</option><option value="Congestion Surcharge">Congestion Surcharge</option><option value="Other">Other</option></select>
      <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={classification} onChange={(event) => setClassification(event.target.value)}><option value="">All Classifications</option><option value="LOCAL">Local</option><option value="INTERNATIONAL">International</option></select>
      <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={loadStatus} onChange={(event) => setLoadStatus(event.target.value)}><option value="">All Load Statuses</option><option value="EMPTY">Empty</option><option value="LOADED">Loaded</option></select>
      <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={collectionPoint} onChange={(event) => setCollectionPoint(event.target.value)}><option value="">All Collection Points</option><option value="GATE_IN">Gate-in</option><option value="GATE_OUT">Gate-out</option><option value="BOTH">Gate-in &amp; Gate-out</option></select>
      <select className="h-10 rounded-lg border bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select>
    </div></div>

    <div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">Configured Rates</h2><p className="text-xs text-muted-foreground">Rates used by gate and operations workflows.</p></div><span className="text-xs text-muted-foreground">{filtered.length} of {rates.length} rates</span></div>

    {loading ? <TableSkeleton rows={7} columns={9} /> : filtered.length ? <div className="overflow-hidden rounded-2xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1320px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-4">Rate</th><th className="px-4 py-4">Classification</th><th className="px-4 py-4">Category</th><th className="px-4 py-4">Load</th><th className="px-4 py-4">Size</th><th className="px-4 py-4">Amount</th><th className="px-4 py-4">Collect At</th><th className="px-4 py-4">Billing</th><th className="px-4 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y">{filtered.map((rate) => <tr key={rate.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><div className="font-bold text-foreground">{rate.name}</div>{rate.description && <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{rate.description}</div>}</td><td className="px-4 py-4"><Badge tone={rate.classification === 'LOCAL' ? 'blue' : 'amber'}>{titleCase(rate.classification)}</Badge></td><td className="px-4 py-4">{rate.containerCategory === 'ALL' ? 'All categories' : titleCase(rate.containerCategory || 'STANDARD')}</td><td className="px-4 py-4"><Badge tone={rate.loadStatus === 'LOADED' ? 'green' : 'slate'}>{rate.loadStatus === 'ALL' ? 'All' : titleCase(rate.loadStatus)}</Badge></td><td className="px-4 py-4 font-semibold">{rate.containerSize === 'ALL' ? 'All Sizes' : rate.containerSize}</td><td className="px-4 py-4 text-base font-black">{money.format(rate.amount)}</td><td className="px-4 py-4"><Badge tone={rate.collectionPoint === 'GATE_IN' ? 'blue' : 'amber'}>{rate.collectionPoint === 'BOTH' ? 'Gate-in & Gate-out' : rate.collectionPoint === 'GATE_IN' ? 'Gate-in' : 'Gate-out'}</Badge></td><td className="px-4 py-4"><Badge tone={rate.billingMode==='OPTIONAL'?'amber':'green'}>{rate.billingMode==='OPTIONAL'?'Manual/Optional':'Fixed/Automatic'}</Badge></td><td className="px-4 py-4"><Badge tone={rate.status === 'ACTIVE' ? 'green' : 'red'}>{titleCase(rate.status)}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{can(MODULES.RATE_SETUP, ACTIONS.EDIT) && <Button size="sm" variant="outline" onClick={() => setModal(rate)}>Edit</Button>}{can(MODULES.RATE_SETUP, ACTIONS.DELETE) && <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => remove(rate)} disabled={busy}>Delete</Button>}</div></td></tr>)}</tbody></table></div></div> : <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><CircleDollarSign className="mx-auto h-10 w-10 text-muted-foreground" /><div className="mt-3 font-bold">No rates found</div><div className="mt-1 text-sm text-muted-foreground">Add your first rate or change the current filters.</div>{can(MODULES.RATE_SETUP, ACTIONS.CREATE) && <Button className="mt-4" onClick={() => setModal({})}><Plus className="h-4 w-4" />Add Rate</Button>}</div>}

    <RateFormModal open={!!modal} rate={modal?.id ? modal : null} busy={busy} onClose={() => setModal(null)} onSubmit={save} />
  </PageContainer>
}
