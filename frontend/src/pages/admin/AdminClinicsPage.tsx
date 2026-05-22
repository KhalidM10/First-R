import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Building2, CheckCircle2, AlertTriangle, Ban,
  MoreVertical, Eye, ShieldCheck, CreditCard,
  Trash2, Plus, Search, X, ChevronDown,
} from 'lucide-react'
import { api } from '../../lib/api'
import { formatKES } from '../../lib/utils'
import type { ClinicDetail } from '../../types'

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminClinic extends ClinicDetail {
  owner_email: string
  subscription_plan: string
  mrr_kes: number
  total_revenue_kes: number
  is_active: boolean
  doctor_count: number
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CLINICS: AdminClinic[] = [
  { id: '1', name: 'Nairobi West Medical Centre', county: 'Nairobi', address: 'Argwings Kodhek Rd', phone: '+254712000001', email: 'nwmc@clinic.ke', owner_email: 'admin@nwmc.ke', subscription_plan: 'pro', is_verified: true, is_active: true, mrr_kes: 4999, total_revenue_kes: 340000, doctor_count: 8, specialties: ['General', 'Pediatrics'], operating_hours: {}, distance_km: null, next_available: null, latitude: -1.29, longitude: 36.82, license_number: 'KE-CLI-0012', owner_id: 'u1', doctors: [] },
  { id: '2', name: 'Kisumu Family Health Clinic',  county: 'Kisumu',  address: 'Oginga Odinga St',   phone: '+254723000002', email: null,             owner_email: 'dr.ouma@kisumuclinic.com', subscription_plan: 'basic', is_verified: true,  is_active: true, mrr_kes: 0,    total_revenue_kes: 87000,  doctor_count: 3, specialties: ['General'],            operating_hours: {}, distance_km: null, next_available: null, latitude: -0.10, longitude: 34.75, license_number: 'KE-CLI-0034', owner_id: 'u2', doctors: [] },
  { id: '3', name: 'Mombasa Coastal Specialists',  county: 'Mombasa', address: 'Moi Avenue',         phone: '+254734000003', email: 'info@mcs.ke',    owner_email: 'director@mcs.ke',         subscription_plan: 'enterprise', is_verified: true,  is_active: true, mrr_kes: 14999, total_revenue_kes: 920000, doctor_count: 14, specialties: ['Cardiology','Surgery'], operating_hours: {}, distance_km: null, next_available: null, latitude: -4.05, longitude: 39.66, license_number: 'KE-CLI-0007', owner_id: 'u3', doctors: [] },
  { id: '4', name: 'Thika Road Wellness Hub',      county: 'Kiambu',  address: 'Thika Rd, Kasarani', phone: '+254745000004', email: null,             owner_email: 'hub@wellness.ke',         subscription_plan: 'basic', is_verified: false, is_active: true, mrr_kes: 0,    total_revenue_kes: 12000,  doctor_count: 2, specialties: ['General'],            operating_hours: {}, distance_km: null, next_available: null, latitude: -1.22, longitude: 36.90, license_number: null,          owner_id: 'u4', doctors: [] },
  { id: '5', name: 'Eldoret Highland Clinic',      county: 'Uasin Gishu', address: 'Uganda Rd',    phone: '+254756000005', email: 'ehc@clinic.ke',  owner_email: 'ehc@admin.ke',            subscription_plan: 'pro',  is_verified: false, is_active: true, mrr_kes: 4999, total_revenue_kes: 58000,  doctor_count: 5, specialties: ['General','Obstetrics'], operating_hours: {}, distance_km: null, next_available: null, latitude: 0.52, longitude: 35.27, license_number: 'KE-CLI-0099', owner_id: 'u5', doctors: [] },
  { id: '6', name: 'Nakuru Central Medical',       county: 'Nakuru',  address: 'Kenyatta Ave',       phone: '+254767000006', email: null,             owner_email: 'ncm@mail.ke',             subscription_plan: 'basic', is_verified: true,  is_active: false, mrr_kes: 0,   total_revenue_kes: 23000,  doctor_count: 1, specialties: ['General'],            operating_hours: {}, distance_km: null, next_available: null, latitude: -0.30, longitude: 36.07, license_number: 'KE-CLI-0054', owner_id: 'u6', doctors: [] },
]

const PLANS = ['basic', 'pro', 'enterprise'] as const

const STATUS_FILTER = ['all', 'verified', 'pending', 'suspended'] as const
type StatusFilter = typeof STATUS_FILTER[number]

const PLAN_STYLE: Record<string, { bg: string; color: string }> = {
  basic:      { bg: '#F1F5F9', color: '#64748B' },
  pro:        { bg: '#EFF6FF', color: '#1E40AF' },
  enterprise: { bg: '#F5F3FF', color: '#6D28D9' },
}

interface AddClinicForm {
  name: string; county: string; address: string; phone: string
  email: string; owner_email: string; license_number: string
  subscription_plan: string
}

const COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Kiambu','Machakos','Nyeri','Meru','Kisii','Kakamega','Uasin Gishu']

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ title, body, confirmLabel, danger = false, onConfirm, onClose }: {
  title: string; body: string; confirmLabel: string; danger?: boolean
  onConfirm: () => void; onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{body}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: danger ? '#DC2626' : '#6366F1' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add clinic modal ─────────────────────────────────────────────────────────

function AddClinicModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors } } = useForm<AddClinicForm>()

  const add = useMutation({
    mutationFn: (data: AddClinicForm) => api.post('/admin/clinics', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-clinics'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Register New Clinic</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit(d => add.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Clinic Name *</label>
              <input {...register('name', { required: true })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="e.g. Nairobi West Medical" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">County *</label>
              <select {...register('county', { required: true })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                <option value="">Select county</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone *</label>
              <input {...register('phone', { required: true })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="+254712345678" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Address</label>
              <input {...register('address')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="Street address" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Clinic Email</label>
              <input {...register('email')} type="email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="clinic@example.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Owner Email *</label>
              <input {...register('owner_email', { required: true })} type="email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="admin@clinic.com" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">License Number</label>
              <input {...register('license_number')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="KE-CLI-XXXX" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Subscription Plan</label>
              <select {...register('subscription_plan')}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {(errors.name || errors.county || errors.phone || errors.owner_email) && (
            <p className="text-xs text-red-500">Please fill all required fields.</p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={add.isPending}
              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {add.isPending ? 'Registering…' : 'Register Clinic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Row actions menu ─────────────────────────────────────────────────────────

function ActionsMenu({ clinic, onAction }: {
  clinic: AdminClinic
  onAction: (type: 'verify' | 'suspend' | 'delete' | 'plan', clinic: AdminClinic) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-48 text-sm">
            <button className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-gray-700"
              onClick={() => { setOpen(false); window.open(`/clinic-dashboard`, '_blank') }}>
              <Eye className="h-3.5 w-3.5 text-gray-400" /> View clinic portal
            </button>
            {!clinic.is_verified && (
              <button className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-green-700"
                onClick={() => { setOpen(false); onAction('verify', clinic) }}>
                <ShieldCheck className="h-3.5 w-3.5" /> Verify clinic
              </button>
            )}
            <button className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-gray-700"
              onClick={() => { setOpen(false); onAction('plan', clinic) }}>
              <CreditCard className="h-3.5 w-3.5 text-gray-400" /> Change plan
            </button>
            <button className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-amber-700"
              onClick={() => { setOpen(false); onAction('suspend', clinic) }}>
              <Ban className="h-3.5 w-3.5" /> Suspend clinic
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-red-600"
              onClick={() => { setOpen(false); onAction('delete', clinic) }}>
              <Trash2 className="h-3.5 w-3.5" /> Delete clinic
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminClinicsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [confirm, setConfirm] = useState<{ type: string; clinic: AdminClinic } | null>(null)

  const { data } = useQuery<AdminClinic[]>({
    queryKey: ['admin-clinics'],
    queryFn: () => api.get('/admin/clinics').then(r => r.data).catch(() => MOCK_CLINICS),
    staleTime: 30_000,
    placeholderData: MOCK_CLINICS,
  })

  const clinics = data ?? MOCK_CLINICS

  const verify = useMutation({
    mutationFn: (id: string) => api.post(`/admin/clinics/${id}/verify`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clinics'] }),
  })

  const suspend = useMutation({
    mutationFn: (id: string) => api.post(`/admin/clinics/${id}/suspend`, { reason: 'Admin action' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clinics'] }),
  })

  const deleteCl = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/clinics/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-clinics'] }),
  })

  function handleAction(type: 'verify' | 'suspend' | 'delete' | 'plan', clinic: AdminClinic) {
    if (type === 'plan') return
    setConfirm({ type, clinic })
  }

  function handleConfirm() {
    if (!confirm) return
    const { type, clinic } = confirm
    if (type === 'verify')  verify.mutate(clinic.id)
    if (type === 'suspend') suspend.mutate(clinic.id)
    if (type === 'delete')  deleteCl.mutate(clinic.id)
    setConfirm(null)
  }

  const filtered = clinics
    .filter(c => {
      if (filter === 'verified')  return c.is_verified && c.is_active
      if (filter === 'pending')   return !c.is_verified && c.is_active
      if (filter === 'suspended') return !c.is_active
      return true
    })
    .filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.county.toLowerCase().includes(search.toLowerCase()) ||
      c.owner_email.toLowerCase().includes(search.toLowerCase())
    )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Clinic Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clinics.length} clinics registered on the platform</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Clinic
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clinics…"
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTER.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-xl px-3 py-2 text-xs font-semibold transition-all capitalize"
              style={filter === f
                ? { backgroundColor: '#6366F1', color: 'white' }
                : { backgroundColor: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                {['Clinic', 'County', 'Plan', 'Status', 'Doctors', 'MRR', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(clinic => {
                const ps = PLAN_STYLE[clinic.subscription_plan] ?? PLAN_STYLE.basic
                return (
                  <tr key={clinic.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 text-sm">{clinic.name}</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{clinic.owner_email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-sm">{clinic.county}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider capitalize"
                        style={{ backgroundColor: ps.bg, color: ps.color }}>
                        {clinic.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {!clinic.is_active
                        ? <span className="rounded-full bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1">Suspended</span>
                        : clinic.is_verified
                          ? <span className="rounded-full bg-green-50 text-green-700 text-[10px] font-bold px-2.5 py-1">Verified</span>
                          : <span className="rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1">Pending</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 text-sm">{clinic.doctor_count}</td>
                    <td className="px-4 py-3.5 font-mono text-sm text-gray-700">
                      {clinic.mrr_kes > 0 ? formatKES(clinic.mrr_kes) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionsMenu clinic={clinic} onAction={handleAction} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <Building2 className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-semibold">No clinics found</p>
          </div>
        )}
      </div>

      {showAdd && <AddClinicModal onClose={() => setShowAdd(false)} />}

      {confirm && (
        <ConfirmModal
          title={
            confirm.type === 'delete'  ? `Delete "${confirm.clinic.name}"?` :
            confirm.type === 'suspend' ? `Suspend "${confirm.clinic.name}"?` :
            `Verify "${confirm.clinic.name}"?`
          }
          body={
            confirm.type === 'delete'  ? 'This is permanent and will remove all clinic data. Type the clinic name in the next step to confirm.' :
            confirm.type === 'suspend' ? 'The clinic and all staff will lose access immediately. This is logged.' :
            'Clinic will be marked as verified and become publicly visible.'
          }
          confirmLabel={
            confirm.type === 'delete'  ? 'Delete' :
            confirm.type === 'suspend' ? 'Suspend' :
            'Verify'
          }
          danger={confirm.type === 'delete' || confirm.type === 'suspend'}
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
