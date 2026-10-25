import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { useAuth } from '@/context/AuthContext.jsx'
import { clientVerificationApi } from '@/lib/adminApi.js'
import { adminSocket } from '@/lib/adminSocket.js'
import { ACTIONS, MODULES } from '@/constants/permissions.js'

const STATUS_STYLE = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
}

const STATUS_ICON = {
  PENDING: Clock3,
  VERIFIED: CheckCircle2,
  REJECTED: XCircle,
}

const DOCUMENT_LABELS = {
  businessPermit: 'Business Permit',
  birCertificate: 'BIR Certificate',
  validId: 'Valid ID',
  authorizationLetter: 'Authorization Letter',
  otherDocument: 'Other Document',
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function fullName(user) {
  if (!user) return '—'
  return [user.firstName, user.middleName, user.lastName, user.suffix].filter(Boolean).join(' ')
}

function StatusBadge({ status }) {
  const Icon = STATUS_ICON[status] || Clock3
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status] || ''}`}>
      <Icon className="h-3.5 w-3.5" />
      {status}
    </span>
  )
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</p>
      </div>
    </div>
  )
}

function RejectDialog({ company, busy, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  if (!company) return null

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Reject verification</h3>
            <p className="text-sm text-slate-500">{company.companyName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">
          <label className="text-sm font-semibold text-slate-800">Rejection reason *</label>
          <textarea
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={5}
            placeholder="Explain what the client needs to correct or replace..."
            className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100"
          />
          <p className="mt-2 text-xs text-slate-500">This reason will be shown in the Client Portal and included in the rejection notification.</p>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            onClick={() => onSubmit(reason.trim())}
            disabled={busy || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {busy ? 'Rejecting...' : 'Reject Application'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function DetailDrawer({ detail, loading, canApprove, canReject, busy, onClose, onApprove, onReject }) {
  const company = detail?.company
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0" />
      <div className="relative h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Client Verification</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{company?.companyName || 'Loading application...'}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X /></button>
        </div>

        {loading || !company ? (
          <div className="grid min-h-[420px] place-items-center text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-slate-50 p-5">
              <div>
                <StatusBadge status={company.verificationStatus} />
                <p className="mt-3 text-sm text-slate-500">Submitted {formatDate(company.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {company.verificationStatus !== 'VERIFIED' && canApprove && (
                  <Button onClick={onApprove} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />Approve
                  </Button>
                )}
                {company.verificationStatus !== 'REJECTED' && canReject && (
                  <Button variant="outline" onClick={onReject} disabled={busy} className="border-red-200 text-red-700 hover:bg-red-50">
                    <XCircle className="mr-2 h-4 w-4" />Reject
                  </Button>
                )}
              </div>
            </div>

            {company.rejectionReason && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-red-500">Current rejection reason</p>
                <p className="mt-2 text-sm leading-relaxed text-red-800">{company.rejectionReason}</p>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <section className="rounded-2xl border p-5">
                <div className="mb-3 flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /><h3 className="font-bold">Company Information</h3></div>
                <InfoRow icon={Building2} label="Company Name" value={company.companyName} />
                <InfoRow icon={MapPin} label="Company Address" value={company.companyAddress} />
                <InfoRow icon={ShieldCheck} label="Business Type" value={company.businessType === 'OTHER' ? company.otherBusinessType : company.businessType} />
              </section>

              <section className="rounded-2xl border p-5">
                <div className="mb-3 flex items-center gap-2"><UserRound className="h-5 w-5 text-primary" /><h3 className="font-bold">Contact Person</h3></div>
                <InfoRow icon={UserRound} label="Name" value={fullName(company.primaryContact)} />
                <InfoRow icon={Mail} label="Email" value={company.primaryContact?.email} />
                <InfoRow icon={Phone} label="Phone" value={company.primaryContact?.phoneNumber} />
                <InfoRow icon={ShieldCheck} label="Position" value={company.primaryContact?.position === 'OTHER' ? company.primaryContact?.otherPosition : company.primaryContact?.position} />
              </section>
            </div>

            <section className="rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h3 className="font-bold">Verification Documents</h3></div>
                <span className="text-xs font-semibold text-slate-400">{company.documents?.length || 0} files</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(company.documents || []).map((document) => (
                  <a
                    key={document.id}
                    href={clientVerificationApi.documentUrl(company.id, document.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border p-3 transition hover:border-primary/30 hover:bg-slate-50"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary"><FileText className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{DOCUMENT_LABELS[document.type] || document.type}</p>
                      <p className="truncate text-xs text-slate-500">{document.name}</p>
                    </div>
                    <Eye className="h-4 w-4 text-slate-400" />
                  </a>
                ))}
                {!company.documents?.length && <p className="text-sm text-slate-500">No verification documents found.</p>}
              </div>
            </section>

            <section className="rounded-2xl border p-5">
              <div className="mb-4 flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /><h3 className="font-bold">Verification History</h3></div>
              <div className="space-y-4">
                {(detail.history || []).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1 border-b pb-4 last:border-b-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-800">{item.status}</p>
                        <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Action by {item.actionByType}</p>
                      {item.reason && <p className="mt-2 text-sm text-slate-600">{item.reason}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClientVerificationPage() {
  const { can } = useAuth()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({ total: 0, PENDING: 0, VERIFIED: 0, REJECTED: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await clientVerificationApi.list()
      setRows(response.data.items || [])
      setSummary(response.data.summary || { total: 0, PENDING: 0, VERIFIED: 0, REJECTED: 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const upsert = (item) => {
      if (!item?.id && !item?.companyId) return
      const id = item.id || item.companyId
      setRows((current) => {
        const existing = current.find((row) => row.id === id)
        if (existing) return current.map((row) => row.id === id ? { ...row, ...item, id } : row)
        if (item.companyName) return [{ ...item, id }, ...current]
        return current
      })
    }

    const handleNew = (payload) => {
      upsert({
        id: payload.companyId,
        companyName: payload.companyName,
        verificationStatus: payload.status,
        createdAt: payload.createdAt,
        updatedAt: payload.createdAt,
        documentCount: payload.documentCount || 0,
        primaryContact: payload.primaryContact || null,
      })
      setSummary((current) => ({ ...current, total: current.total + 1, PENDING: current.PENDING + 1 }))
    }
    const handleResubmitted = (payload) => {
      setRows((current) => current.map((row) => row.id === payload.companyId ? { ...row, verificationStatus: 'PENDING', rejectionReason: null, updatedAt: payload.updatedAt } : row))
    }
    const handleUpdated = (payload) => upsert(payload)

    adminSocket.on('client:verification:new', handleNew)
    adminSocket.on('client:verification:resubmitted', handleResubmitted)
    adminSocket.on('admin:client-verification:updated', handleUpdated)
    return () => {
      adminSocket.off('client:verification:new', handleNew)
      adminSocket.off('client:verification:resubmitted', handleResubmitted)
      adminSocket.off('admin:client-verification:updated', handleUpdated)
    }
  }, [])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (status && row.verificationStatus !== status) return false
      if (!needle) return true
      return [row.companyName, row.primaryContact?.email, fullName(row.primaryContact), row.businessType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [rows, search, status])

  const openDetail = async (id) => {
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    setError('')
    try {
      const response = await clientVerificationApi.detail(id)
      setDetail(response.data)
    } catch (err) {
      setError(err.message)
      setSelectedId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const updateRow = (company) => {
    setRows((current) => current.map((row) => row.id === company.id ? { ...row, ...company } : row))
    setDetail((current) => current ? { ...current, company: { ...current.company, ...company } } : current)
  }

  const approve = async () => {
    if (!selectedId) return
    setBusy(true)
    setError('')
    try {
      const response = await clientVerificationApi.approve(selectedId)
      updateRow(response.data.company)
      setDetail((current) => current ? {
        ...current,
        history: [{ id: `approved-${Date.now()}`, status: 'VERIFIED', reason: 'Approved', actionByType: 'ADMIN', createdAt: new Date().toISOString() }, ...(current.history || [])],
      } : current)
      setNotice('Company verified successfully.')
      setSummary((current) => ({
        ...current,
        VERIFIED: current.VERIFIED + 1,
        PENDING: Math.max(0, current.PENDING - (detail?.company?.verificationStatus === 'PENDING' ? 1 : 0)),
        REJECTED: Math.max(0, current.REJECTED - (detail?.company?.verificationStatus === 'REJECTED' ? 1 : 0)),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const reject = async (reason) => {
    if (!selectedId) return
    setBusy(true)
    setError('')
    try {
      const previous = detail?.company?.verificationStatus
      const response = await clientVerificationApi.reject(selectedId, reason)
      updateRow(response.data.company)
      setDetail((current) => current ? {
        ...current,
        history: [{ id: `rejected-${Date.now()}`, status: 'REJECTED', reason, actionByType: 'ADMIN', createdAt: new Date().toISOString() }, ...(current.history || [])],
      } : current)
      setRejectOpen(false)
      setNotice('Verification rejected and the client was notified.')
      setSummary((current) => ({
        ...current,
        REJECTED: current.REJECTED + (previous === 'REJECTED' ? 0 : 1),
        PENDING: Math.max(0, current.PENDING - (previous === 'PENDING' ? 1 : 0)),
        VERIFIED: Math.max(0, current.VERIFIED - (previous === 'VERIFIED' ? 1 : 0)),
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Client Verification" description="Review registered companies, verification documents, and approval status." />

      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{notice}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">{error}</div>}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Applications" value={summary.total} icon={Building2} tone="bg-blue-50 text-blue-700" />
        <SummaryCard label="Pending Review" value={summary.PENDING} icon={Clock3} tone="bg-amber-50 text-amber-700" />
        <SummaryCard label="Verified" value={summary.VERIFIED} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard label="Requires Attention" value={summary.REJECTED} icon={XCircle} tone="bg-red-50 text-red-700" />
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border bg-white p-4">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, contact person, or email..." className="pl-9" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Company</th>
              <th className="px-5 py-3.5">Contact Person</th>
              <th className="px-5 py-3.5">Business Type</th>
              <th className="px-5 py-3.5">Documents</th>
              <th className="px-5 py-3.5">Submitted</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t transition hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <p className="font-bold text-slate-900">{row.companyName}</p>
                  <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{row.companyAddress || 'No address'}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-800">{fullName(row.primaryContact)}</p>
                  <p className="mt-1 text-xs text-slate-500">{row.primaryContact?.email || '—'}</p>
                </td>
                <td className="px-5 py-4">{row.businessType === 'OTHER' ? row.otherBusinessType : row.businessType}</td>
                <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5"><FileText className="h-4 w-4 text-slate-400" />{row.documentCount || 0}</span></td>
                <td className="px-5 py-4 text-slate-600">{formatDate(row.createdAt)}</td>
                <td className="px-5 py-4"><StatusBadge status={row.verificationStatus} /></td>
                <td className="px-5 py-4 text-right">
                  <button onClick={() => openDetail(row.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-primary hover:bg-blue-50">
                    <Eye className="h-4 w-4" />Review
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !filtered.length && (
              <tr><td colSpan="7" className="px-5 py-16 text-center text-slate-500">No client verification applications found.</td></tr>
            )}
            {loading && !rows.length && (
              <tr><td colSpan="7" className="px-5 py-16 text-center text-slate-500">Loading registered clients...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedId && (
        <DetailDrawer
          detail={detail}
          loading={detailLoading}
          canApprove={can(MODULES.CLIENT_VERIFICATION, ACTIONS.APPROVE)}
          canReject={can(MODULES.CLIENT_VERIFICATION, ACTIONS.REJECT)}
          busy={busy}
          onClose={() => { setSelectedId(null); setDetail(null); setRejectOpen(false) }}
          onApprove={approve}
          onReject={() => setRejectOpen(true)}
        />
      )}

      <RejectDialog company={rejectOpen ? detail?.company : null} busy={busy} onClose={() => setRejectOpen(false)} onSubmit={reject} />
    </PageContainer>
  )
}
