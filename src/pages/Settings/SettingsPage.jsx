import { Building2, Clock3, Mail, MapPin, Phone, Save } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { ACTIONS, MODULES } from '@/constants/permissions.js'
import { settingsApi } from '@/lib/settingsApi.js'
import { adminSocket } from '@/lib/adminSocket.js'

const emptyForm = {
  phone: '',
  email: '',
  office: '',
  operatingHours: '24 hours daily',
  schedule: { openingTime:'00:00',closingTime:'24:00',operatingDays:[0,1,2,3,4,5,6],maxBookingsPerHour:4,active:true },
  overtime: { start:'18:00',end:'08:00',fee:0,active:true },
  tax: {vatRate:12,vatInclusive:false},
  shiftingFee:0,
  storageBilling:{rounding:'CALENDAR_DAYS'},
}

function Field({ icon: Icon, label, hint, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="size-4" />
        </span>
        <div>
          <label className="text-sm font-bold text-foreground">{label}</label>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { can } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const requestRef = useRef(null)
  const initializedRef = useRef(false)

  const load = useCallback(async () => {
    if (requestRef.current) return requestRef.current
    setLoading(true)
    setError('')
    const request = settingsApi.getCompanyContact()
      .then((response) => {
        setForm({ ...emptyForm, ...(response.data || {}), storageBilling:{rounding:'CALENDAR_DAYS'} })
        return response.data
      })
      .catch((err) => {
        setError(err.message || 'Unable to load company settings.')
        throw err
      })
      .finally(() => {
        requestRef.current = null
        setLoading(false)
      })
    requestRef.current = request
    return request
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    load().catch(() => {})
  }, [load])

  useEffect(() => {
    const handleUpdate = (data) => setForm((current) => ({ ...current, ...data }))
    adminSocket.on('settings:company-updated', handleUpdate)
    return () => adminSocket.off('settings:company-updated', handleUpdate)
  }, [])

  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  const nested=(group,key,value)=>setForm(current=>({...current,[group]:{...current[group],[key]:value}}))
  const days=[['Sun',0],['Mon',1],['Tue',2],['Wed',3],['Thu',4],['Fri',5],['Sat',6]]
  const is24Hours = form.schedule?.openingTime === '00:00' && form.schedule?.closingTime === '24:00'
  const toggle24Hours = (checked) => setForm(current=>({...current,operatingHours:checked?'24 hours daily':current.operatingHours,schedule:{...current.schedule,openingTime:checked?'00:00':'08:00',closingTime:checked?'24:00':'17:00',operatingDays:checked?[0,1,2,3,4,5,6]:current.schedule.operatingDays}}))

  const save = async (event) => {
    event.preventDefault()
    if (!can(MODULES.SETTINGS, ACTIONS.EDIT)) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await settingsApi.updateCompanyContact({...form,storageBilling:{rounding:'CALENDAR_DAYS'}})
      setForm({ ...emptyForm, ...(response.data || {}), storageBilling:{rounding:'CALENDAR_DAYS'} })
      setNotice('Company contact information saved successfully.')
      setTimeout(() => setNotice(''), 3500)
    } catch (err) {
      setError(err.message || 'Unable to save company settings.')
    } finally {
      setSaving(false)
    }
  }

  const editable = can(MODULES.SETTINGS, ACTIONS.EDIT)

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage company details, operating hours, booking capacity, shifting fees, overtime, and tax rules."
      />

      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={save} className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3 border-b pb-5">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground">Company Contact Information</h2>
              <p className="mt-1 text-sm text-muted-foreground">These details appear on the Client Contact page and website footer.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Loading company settings...</div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Field icon={Phone} label="Phone" hint="Official contact number shown to clients.">
                <Input value={form.phone} onChange={change('phone')} disabled={!editable || saving} placeholder="e.g. +63 917 123 4567" />
              </Field>

              <Field icon={Mail} label="Email" hint="Official public contact email.">
                <Input type="email" value={form.email} onChange={change('email')} disabled={!editable || saving} placeholder="e.g. info@company.com" />
              </Field>

              <Field icon={MapPin} label="Office" hint="Office or terminal address displayed publicly.">
                <textarea
                  value={form.office}
                  onChange={change('office')}
                  disabled={!editable || saving}
                  placeholder="Enter office address"
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>

              <Field icon={Clock3} label="Operating Hours" hint="Displayed publicly; operational booking hours are enforced below.">
                <textarea
                  value={form.operatingHours}
                  onChange={change('operatingHours')}
                  disabled={!editable || saving}
                  placeholder={'24 hours daily'}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>
            </div>
          )}

          {!loading&&<div className="mt-8 space-y-7 border-t pt-7">
            <section className="space-y-4 rounded-xl border p-4">
              <div><h3 className="font-bold">Operational Booking Hours & Capacity</h3><p className="text-xs text-muted-foreground">Asia/Manila. Gate-in and Gate-out share the same hourly capacity. A full day includes hourly slots 00:00 through 23:00.</p></div>
              <label className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm"><input className="mt-1" type="checkbox" checked={is24Hours} onChange={e=>toggle24Hours(e.target.checked)} disabled={!editable||saving}/><span><strong>24-hour operations</strong><span className="mt-1 block text-xs text-muted-foreground">Open around the clock, midnight to midnight. Enabling selects all seven days; the capacity limit still applies per hour.</span></span></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.schedule?.active??true} onChange={e=>nested('schedule','active',e.target.checked)} disabled={!editable||saving}/> Accept new bookings</label>
              <div className="grid gap-3 sm:grid-cols-3">{is24Hours ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm sm:col-span-2"><strong>Open 24 hours</strong><span className="mt-1 block text-xs">00:00–24:00 (midnight to midnight, Asia/Manila)</span></div> : <><label className="text-sm">Opens<input className="input mt-1" type="time" step="3600" value={form.schedule?.openingTime||'08:00'} onChange={e=>nested('schedule','openingTime',e.target.value)} disabled={!editable||saving}/></label><label className="text-sm">Closes<input className="input mt-1" type="time" step="3600" value={form.schedule?.closingTime||'17:00'} onChange={e=>nested('schedule','closingTime',e.target.value)} disabled={!editable||saving}/></label></>}<label className="text-sm">Maximum bookings / hour<input className="input mt-1" type="number" min="1" max="100" value={form.schedule?.maxBookingsPerHour??4} onChange={e=>nested('schedule','maxBookingsPerHour',Number(e.target.value))} disabled={!editable||saving}/></label></div>
              <div><p className="mb-2 text-sm font-bold">Operating days</p><div className="flex flex-wrap gap-3">{days.map(([label,value])=><label key={value} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" disabled={!editable||saving} checked={(form.schedule?.operatingDays||[]).includes(value)} onChange={e=>nested('schedule','operatingDays',e.target.checked?[...new Set([...(form.schedule?.operatingDays||[]),value])].sort():form.schedule.operatingDays.filter(d=>d!==value))}/>{label}</label>)}</div></div>
            </section>
            <section className="space-y-4 rounded-xl border p-4"><h3 className="font-bold">Centralized Overtime</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.overtime?.active||false} onChange={e=>nested('overtime','active',e.target.checked)} disabled={!editable||saving}/> Apply overtime fee</label><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Start<input type="time" className="input mt-1" step="3600" value={form.overtime?.start||'18:00'} onChange={e=>nested('overtime','start',e.target.value)} disabled={!editable||saving}/></label><label className="text-sm">End<input type="time" className="input mt-1" step="3600" value={form.overtime?.end||'08:00'} onChange={e=>nested('overtime','end',e.target.value)} disabled={!editable||saving}/></label><label className="text-sm">Overtime fallback fee (PHP)<input type="number" className="input mt-1" min="0" step="0.01" value={form.overtime?.fee??0} onChange={e=>nested('overtime','fee',Number(e.target.value))} disabled={!editable||saving}/></label></div><p className="text-xs text-muted-foreground">Overtime applies automatically to both Gate-in and Gate-out during this configured time window, regardless of classification, container category, load status, or size. This fee is the universal fallback; configure an All/Both overtime rate or add editable category-specific overtime overrides in Rate Setup. OT never expands operational hours.</p></section>
            <section className="space-y-4 rounded-xl border p-4">
              <h3 className="font-bold">Storage Day Counting</h3>
              <p className="text-xs text-muted-foreground">Default: inclusive Asia/Manila calendar dates. Oct 27 at 10 PM through Oct 28 at 1 AM counts as 2 days, even though the elapsed time is only 3 hours.</p>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Active billing rule: inclusive Manila calendar dates (fixed). Midnight starts a new billable day.</p>
              <p className="text-xs text-muted-foreground">Quotes use the scheduled Gate-out date; the final storage duration uses actual physical release. Paid invoices are not silently recalculated.</p>
            </section>
            <section className="space-y-4 rounded-xl border p-4"><h3 className="font-bold">Gate-in Shifting Fee & VAT</h3><div className="grid gap-3 sm:grid-cols-3"><label className="text-sm">Legacy fallback shifting fee (PHP)<input className="input mt-1" type="number" min="0" step="0.01" value={form.shiftingFee??0} onChange={e=>setForm(current=>({...current,shiftingFee:Number(e.target.value)}))} disabled={!editable||saving}/></label><label className="text-sm">VAT rate (%)<input className="input mt-1" type="number" min="0" max="100" step="0.01" value={form.tax?.vatRate??12} onChange={e=>nested('tax','vatRate',Number(e.target.value))} disabled={!editable||saving}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.tax?.vatInclusive||false} onChange={e=>nested('tax','vatInclusive',e.target.checked)} disabled={!editable||saving}/> Rates include VAT</label></div><p className="text-xs text-muted-foreground">For size/classification-specific shifting prices use Rate Setup → Shifting Fee (Gate-in). A configured shifting rate overrides this legacy fallback amount; it is never charged twice. Storage defaults to calendar-date counting in Asia/Manila: each date touched counts as one day, even for a short stay crossing midnight.</p></section>
          </div>}

          {editable && !loading && (
            <div className="mt-6 flex justify-end border-t pt-5">
              <Button type="submit" disabled={saving}>
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>

        <aside className="rounded-2xl border bg-slate-50 p-5">
          <h3 className="font-bold text-foreground">Client Website Preview</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Blank values will display as “To be supplied” until configured.</p>
          <div className="mt-5 space-y-4 text-sm">
            <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Phone</div><div className="mt-1 font-semibold text-foreground">{form.phone || 'To be supplied'}</div></div>
            <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email</div><div className="mt-1 break-all font-semibold text-foreground">{form.email || 'To be supplied'}</div></div>
            <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Office</div><div className="mt-1 whitespace-pre-line font-semibold text-foreground">{form.office || 'To be supplied'}</div></div>
            <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Operating Hours</div><div className="mt-1 whitespace-pre-line font-semibold text-foreground">{is24Hours ? '24 hours daily' : (form.operatingHours || 'To be supplied')}</div></div>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}
