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
  operatingHours: '',
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
        setForm({ ...emptyForm, ...(response.data || {}) })
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

  const save = async (event) => {
    event.preventDefault()
    if (!can(MODULES.SETTINGS, ACTIONS.EDIT)) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const response = await settingsApi.updateCompanyContact(form)
      setForm({ ...emptyForm, ...(response.data || {}) })
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
        description="Manage company information displayed across the client website."
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

              <Field icon={Clock3} label="Operating Hours" hint="Use one or multiple lines if schedules differ by day.">
                <textarea
                  value={form.operatingHours}
                  onChange={change('operatingHours')}
                  disabled={!editable || saving}
                  placeholder={'e.g. Monday-Friday: 8:00 AM-5:00 PM\nSaturday: 8:00 AM-12:00 PM'}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </Field>
            </div>
          )}

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
            <div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Operating Hours</div><div className="mt-1 whitespace-pre-line font-semibold text-foreground">{form.operatingHours || 'To be supplied'}</div></div>
          </div>
        </aside>
      </div>
    </PageContainer>
  )
}
