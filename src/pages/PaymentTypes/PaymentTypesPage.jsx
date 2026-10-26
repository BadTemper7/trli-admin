import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, Landmark, Smartphone, Pencil, Power, AlertCircle, CheckCircle2 } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { paymentTypeApi } from '@/lib/paymentTypeApi.js'
import { adminSocket } from '@/lib/adminSocket.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'

const TYPES = [
  { code: 'BANK', name: 'Bank', icon: Landmark, description: 'Bank deposit or bank transfer payment.', requiresReference: true },
  { code: 'E_WALLET', name: 'E-wallet', icon: Smartphone, description: 'Electronic wallet payment.', requiresReference: true },
  { code: 'GCASH', name: 'GCash', icon: Smartphone, description: 'GCash transfer payment.', requiresReference: true },
  { code: 'MAYA', name: 'Maya', icon: Smartphone, description: 'Maya e-wallet transfer payment.', requiresReference: true },
]
const defaults = { code: 'BANK', name: 'Bank', status: 'ACTIVE', requiresReference: true, description: TYPES[0].description, bankName: '', accountName: '', accountNumber: '' }

function PaymentTypesPage() {
  const { can } = useAuth()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(defaults)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try { setError(''); const result = await paymentTypeApi.list(); setRows(result.data || []) }
    catch (e) { setError(e.message) }
  }, [])

  useEffect(() => {
    load()
    const created = (row) => setRows((current) => current.some((x) => x.id === row.id) ? current : [...current, row])
    const updated = (row) => setRows((current) => current.map((x) => x.id === row.id ? row : x))
    adminSocket.on('payment-type:created', created)
    adminSocket.on('payment-type:updated', updated)
    return () => { adminSocket.off('payment-type:created', created); adminSocket.off('payment-type:updated', updated) }
  }, [load])

  const counts = useMemo(() => ({ active: rows.filter((x) => x.status === 'ACTIVE').length, inactive: rows.filter((x) => x.status === 'INACTIVE').length }), [rows])
  const startCreate = () => { setEditing(null); setForm(defaults); setOpen(true); setError('') }
  const startEdit = (row) => { setEditing(row); setForm({ code: row.code, name: row.name, status: row.status, requiresReference: row.requiresReference, description: row.description || '', bankName: row.bankName || '', accountName: row.accountName || '', accountNumber: row.accountNumber || '' }); setOpen(true); setError('') }
  const onCode = (code) => { const preset = TYPES.find((x) => x.code === code); setForm((x) => ({ ...x, code, name: preset?.name || x.name, description: preset?.description || x.description, requiresReference: code === 'CASH' ? false : true, ...(code === 'CASH' ? { bankName: '', accountName: '', accountNumber: '' } : {}) })) }
  const save = async () => {
    if (form.code !== 'CASH' && (![form.bankName,form.accountName,form.accountNumber].every(v => String(v || '').trim()))) { setError('Enter the payment provider, account holder name, and account number before saving.'); return }
    setBusy(true)
    try {
      const result = editing ? await paymentTypeApi.update(editing.id, form) : await paymentTypeApi.create(form)
      setRows((current) => editing ? current.map((x) => x.id === result.data.id ? result.data : x) : [...current, result.data])
      setOpen(false)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  const disable = async (row) => {
    if (!window.confirm(`Disable ${row.name}? It will no longer be available for new payments.`)) return
    try { const result = await paymentTypeApi.disable(row.id); setRows((current) => current.map((x) => x.id === row.id ? result.data : x)) } catch (e) { setError(e.message) }
  }

  return <PageContainer>
    <PageHeader title="Payment Types" description="Manage the payment methods available for Gate-in and Gate-out transactions." actions={null} />
    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-800">
      <strong>Configure receiving accounts:</strong> Bank, GCash, Maya and E-wallet are available as supported methods. Click <b>Edit</b> and enter the actual payment provider, account holder name and account number. A method only appears as selectable in the client portal when its account is complete and ACTIVE. Cash is not supported.
    </div>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      <Summary label="Configured" value={rows.length} />
      <Summary label="Active" value={counts.active} />
      <Summary label="Inactive" value={counts.inactive} />
    </div>

    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Payment Type</th><th className="px-5 py-3">Account Details</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Description</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => { const Icon = TYPES.find((x) => x.code === row.code)?.icon || Banknote; return <tr key={row.id} className="hover:bg-muted/20"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span><div><div className="font-semibold text-foreground">{row.name}</div><div className="text-xs text-muted-foreground">{row.code}</div>{row.code!=='CASH'&&(row.isConfigured?<span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13}/> Account ready</span>:<span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertCircle size={13}/> Account setup required</span>)}</div></div></td><td className="px-5 py-4">{row.code === 'CASH' ? <span className="text-muted-foreground">Not applicable</span> : <div><div className="font-semibold">{row.bankName || '—'}</div><div className="text-xs text-muted-foreground">{row.accountName || '—'}</div><div className="text-xs font-mono text-muted-foreground">{row.accountNumber || '—'}</div></div>}</td><td className="px-5 py-4">{row.requiresReference ? 'Required' : 'Not required'}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{row.status}</span></td><td className="max-w-md px-5 py-4 text-muted-foreground">{row.description || '—'}</td><td className="px-5 py-4"><div className="flex justify-end gap-2">{row.code!=='CASH' && can(MODULES.PAYMENT_TYPES, ACTIONS.EDIT) && <Button variant="outline" size="sm" onClick={() => startEdit(row)}><Pencil size={15}/> Edit</Button>}{row.status === 'ACTIVE' && can(MODULES.PAYMENT_TYPES, ACTIONS.DELETE) && <Button variant="outline" size="sm" onClick={() => disable(row)}><Power size={15}/> Disable</Button>}</div></td></tr> })}
            {!rows.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-muted-foreground">No payment types configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>

    {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"><div className="mb-5"><h2 className="text-xl font-bold">{editing ? 'Edit Payment Type' : 'Add Payment Type'}</h2><p className="mt-1 text-sm text-muted-foreground">These receiving-account details are shown to clients during Gate-in and Gate-out payment submission.</p></div><div className="grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium">Payment Type<select className="h-10 rounded-lg border border-input bg-background px-3" value={form.code} onChange={(e) => onCode(e.target.value)} disabled={Boolean(editing)}>{form.code==='CASH'&&<option value="CASH">Cash (legacy, unsupported)</option>}{TYPES.map((x) => <option value={x.code} key={x.code}>{x.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium">Display Name<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
      <label className="grid gap-1.5 text-sm font-medium">Status<select className="h-10 rounded-lg border border-input bg-background px-3" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></label>
      <label className="grid gap-1.5 text-sm font-medium">Description<textarea className="min-h-24 rounded-xl border border-input bg-background p-3 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
      {form.code !== 'CASH' && <div className="grid gap-4 rounded-2xl border border-border bg-muted/25 p-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">{form.code === 'BANK' ? 'Bank Name' : 'E-wallet Name'}<Input required value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder={form.code === 'BANK' ? 'e.g. BDO' : 'e.g. GCash'}/></label>
        <label className="grid gap-1.5 text-sm font-medium">Account Owner Name<Input required value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="Account owner"/></label>
        <label className="grid gap-1.5 text-sm font-medium">Account Number<Input required value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} placeholder="Account number"/></label>
      </div>}
      <label className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" className="mt-1" checked={form.code!=='CASH'} disabled onChange={(e) => setForm({ ...form, requiresReference: e.target.checked })}/><span><b>Require payment reference</b><span className="mt-1 block text-muted-foreground">An online payment reference is mandatory for Bank, GCash, Maya, and E-wallet. Cash is not supported.</span></span></label>
    </div><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? 'Saving...' : 'Save Payment Type'}</Button></div></div></div>}
  </PageContainer>
}
function Summary({ label, value }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-bold text-foreground">{value}</p></div> }
export default PaymentTypesPage
