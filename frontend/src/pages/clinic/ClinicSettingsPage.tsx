import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Settings, Building2, Phone, Clock, Users, ShieldAlert,
  CheckCircle2, ChevronRight, Mail, MapPin, Hash, Plus, X,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { cn } from '../../lib/utils'
import type { ClinicDetail } from '../../types'

type Tab = 'general' | 'contact' | 'hours' | 'team' | 'danger'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'general',  label: 'General',      icon: Building2 },
  { key: 'contact',  label: 'Contact',       icon: Phone },
  { key: 'hours',    label: 'Hours',         icon: Clock },
  { key: 'team',     label: 'Team',          icon: Users },
  { key: 'danger',   label: 'Danger Zone',   icon: ShieldAlert },
]

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

const ALL_SPECIALTIES = [
  'General Practice', 'Pediatrics', 'Gynecology & Obstetrics', 'Internal Medicine',
  'General Surgery', 'Dermatology', 'Orthopedics', 'Cardiology', 'Neurology',
  'Ophthalmology', 'ENT', 'Psychiatry', 'Radiology', 'Oncology', 'Urology',
  'Diabetology', 'Physiotherapy', 'Nutrition & Dietetics',
]

const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru', 'Nyeri', 'Kisii',
  'Kilifi', 'Kericho', 'Embu', 'Migori', 'Homa Bay', 'Siaya', 'Vihiga',
  'Bungoma', 'Trans Nzoia', 'Uasin Gishu', 'Nandi', 'Bomet', 'Kericho',
]

// ─── Saved toast ─────────────────────────────────────────────────────────────

function SavedToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-xl transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      )}
      style={{ backgroundColor: '#0F172A' }}
    >
      <CheckCircle2 className="h-5 w-5 text-green-400" />
      <p className="text-sm font-semibold text-white">Settings saved</p>
    </div>
  )
}

// ─── General tab ─────────────────────────────────────────────────────────────

interface GeneralForm {
  name: string
  address: string
  county: string
  license_number: string
}

function GeneralTab({ clinic, onSaved }: { clinic: ClinicDetail; onSaved: () => void }) {
  const qc = useQueryClient()
  const [specialties, setSpecialties] = useState<string[]>(clinic.specialties ?? [])
  const [specInput, setSpecInput] = useState('')

  const { register, handleSubmit, formState: { isDirty } } = useForm<GeneralForm>({
    defaultValues: {
      name: clinic.name,
      address: clinic.address,
      county: clinic.county,
      license_number: clinic.license_number ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: GeneralForm) =>
      api.put(`/clinics/${clinic.id}`, { ...data, specialties }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-stats'] })
      qc.invalidateQueries({ queryKey: ['clinic-detail'] })
      onSaved()
    },
  })

  function addSpecialty(s: string) {
    if (s && !specialties.includes(s)) setSpecialties(prev => [...prev, s])
    setSpecInput('')
  }

  function removeSpecialty(s: string) {
    setSpecialties(prev => prev.filter(x => x !== s))
  }

  const suggestions = ALL_SPECIALTIES.filter(
    s => s.toLowerCase().includes(specInput.toLowerCase()) && !specialties.includes(s),
  ).slice(0, 5)

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-4">Clinic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Clinic Name *</label>
            <input
              {...register('name', { required: true })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Physical Address *</label>
            <input
              {...register('address', { required: true })}
              placeholder="Street, building, floor"
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">County *</label>
              <select
                {...register('county', { required: true })}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">License Number</label>
              <input
                {...register('license_number')}
                placeholder="KMPDB-XXXX"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1.5">Medical Specialties</h3>
        <p className="text-xs text-gray-400 mb-3">
          Patients filter clinics by specialty. Add all that apply.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {specialties.map(s => (
            <span
              key={s}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
            >
              {s}
              <button
                type="button"
                onClick={() => removeSpecialty(s)}
                className="hover:text-blue-900 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {specialties.length === 0 && (
            <span className="text-xs text-gray-400">No specialties added yet</span>
          )}
        </div>
        <div className="relative">
          <input
            value={specInput}
            onChange={e => setSpecInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty(specInput))}
            placeholder="Type to add specialty…"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
          {specInput && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10"
            >
              {suggestions.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSpecialty(s)}
                  className="w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E40AF' }}
        >
          {mutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// ─── Contact tab ──────────────────────────────────────────────────────────────

interface ContactForm {
  phone: string
  email: string
}

function ContactTab({ clinic, onSaved }: { clinic: ClinicDetail; onSaved: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit } = useForm<ContactForm>({
    defaultValues: { phone: clinic.phone, email: clinic.email ?? '' },
  })

  const mutation = useMutation({
    mutationFn: (data: ContactForm) =>
      api.put(`/clinics/${clinic.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-detail'] })
      onSaved()
    },
  })

  return (
    <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Contact Details</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-400" /> Phone Number *
            </span>
          </label>
          <input
            {...register('phone', { required: true })}
            placeholder="+254 700 000 000"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">Displayed to patients on your clinic profile.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-400" /> Email Address
            </span>
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="clinic@example.com"
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
          <p className="text-[11px] text-gray-400 mt-1.5">Used for appointment notifications and system alerts.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E40AF' }}
        >
          {mutation.isPending ? 'Saving…' : 'Save Contact'}
        </button>
      </div>
    </form>
  )
}

// ─── Hours tab ────────────────────────────────────────────────────────────────

function HoursTab({ clinic, onSaved }: { clinic: ClinicDetail; onSaved: () => void }) {
  const qc = useQueryClient()
  type DayHours = { open: string; close: string; closed: boolean }
  const [hours, setHours] = useState<Record<string, DayHours>>(() => {
    const base: Record<string, DayHours> = {}
    for (const day of DAYS_ORDER) {
      const existing = (clinic.operating_hours ?? {})[day]
      base[day] = existing
        ? { open: existing.open ?? '08:00', close: existing.close ?? '17:00', closed: false }
        : { open: '08:00', close: '17:00', closed: true }
    }
    return base
  })

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, { open: string; close: string }> = {}
      for (const [day, h] of Object.entries(hours)) {
        if (!h.closed) payload[day] = { open: h.open, close: h.close }
      }
      return api.put(`/clinics/${clinic.id}`, { operating_hours: payload })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-detail'] })
      onSaved()
    },
  })

  function update(day: string, field: 'open' | 'close' | 'closed', value: string | boolean) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">Operating Hours</h3>
        <p className="text-xs text-gray-400">Set your opening and closing times for each day. Closed days won't appear in patient booking.</p>
      </div>

      <div className="space-y-2">
        {DAYS_ORDER.map(day => {
          const h = hours[day]
          return (
            <div
              key={day}
              className={cn(
                'flex items-center gap-4 rounded-xl px-4 py-3',
                h.closed ? 'bg-gray-50' : 'bg-white border border-gray-100',
              )}
            >
              <div className="w-24 shrink-0">
                <p className={cn('text-sm font-semibold', h.closed ? 'text-gray-400' : 'text-gray-800')}>
                  {DAY_LABELS[day]}
                </p>
              </div>

              {h.closed ? (
                <p className="flex-1 text-xs text-gray-400">Closed</p>
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={h.open}
                    onChange={e => update(day, 'open', e.target.value)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400">to</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={e => update(day, 'close', e.target.value)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}

              <button
                onClick={() => update(day, 'closed', !h.closed)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  h.closed
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-red-50 text-red-600 hover:bg-red-100',
                )}
              >
                {h.closed ? 'Open' : 'Close'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-xl px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E40AF' }}
        >
          {mutation.isPending ? 'Saving…' : 'Save Hours'}
        </button>
      </div>
    </div>
  )
}

// ─── Team tab ─────────────────────────────────────────────────────────────────

const MOCK_TEAM = [
  { id: '1', name: 'Dr. Sarah Mwangi', email: 'sarah@clinic.ke', role: 'clinic_admin', lastSeen: '2 min ago', active: true },
  { id: '2', name: 'James Kariuki', email: 'james@clinic.ke', role: 'clinic_receptionist', lastSeen: '1 hr ago', active: true },
  { id: '3', name: 'Dr. Ahmed Hassan', email: 'ahmed@clinic.ke', role: 'clinic_doctor', lastSeen: 'Yesterday', active: true },
  { id: '4', name: 'Grace Otieno', email: 'grace@clinic.ke', role: 'clinic_pharmacist', lastSeen: '3 days ago', active: false },
]

const ROLE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  clinic_admin:         { label: 'Admin',       bg: '#EFF6FF', color: '#1E40AF' },
  clinic_doctor:        { label: 'Doctor',      bg: '#ECFDF5', color: '#059669' },
  clinic_receptionist:  { label: 'Receptionist', bg: '#FEF3C7', color: '#92400E' },
  clinic_pharmacist:    { label: 'Pharmacist',  bg: '#EDE9FE', color: '#5B21B6' },
}

function TeamTab() {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('clinic_doctor')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Team Members</h3>
          <p className="text-xs text-gray-400 mt-0.5">Manage who has access to your clinic dashboard.</p>
        </div>
        <button
          onClick={() => setShowInvite(v => !v)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E40AF' }}
        >
          <Plus className="h-3.5 w-3.5" />
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
        >
          <h4 className="text-xs font-bold text-gray-700">Invite New Team Member</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@clinic.ke"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
              >
                <option value="clinic_doctor">Doctor</option>
                <option value="clinic_receptionist">Receptionist</option>
                <option value="clinic_pharmacist">Pharmacist</option>
                <option value="clinic_admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowInvite(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-xl py-2 text-xs font-bold text-white opacity-70 cursor-not-allowed"
              style={{ backgroundColor: '#1E40AF' }}
              disabled
              title="Invite flow coming soon"
            >
              Send Invite (Coming Soon)
            </button>
          </div>
        </div>
      )}

      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {MOCK_TEAM.map((member, i) => {
          const badge = ROLE_BADGE[member.role] ?? ROLE_BADGE.clinic_doctor
          return (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-4 px-5 py-4',
                i < MOCK_TEAM.length - 1 && 'border-b border-gray-50',
              )}
            >
              <div
                className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold"
                style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
              >
                {member.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{member.email}</p>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
              <div className="text-right">
                <span
                  className={cn(
                    'block h-2 w-2 rounded-full mx-auto mb-1',
                    member.active ? 'bg-green-400' : 'bg-gray-300',
                  )}
                />
                <p className="text-[10px] text-gray-400">{member.lastSeen}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Danger Zone tab ──────────────────────────────────────────────────────────

function DangerTab({ clinicName }: { clinicName: string }) {
  const [confirmName, setConfirmName] = useState('')
  const canDeactivate = confirmName === clinicName

  return (
    <div className="space-y-6">
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #FEE2E2' }}>
        <div className="px-5 py-4" style={{ backgroundColor: '#FFF5F5' }}>
          <h3 className="text-sm font-bold text-red-800">Danger Zone</h3>
          <p className="text-xs text-red-600 mt-0.5">These actions are irreversible. Proceed with extreme caution.</p>
        </div>

        <div className="p-5 space-y-5 bg-white">
          {/* Deactivate */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Deactivate Clinic</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Your clinic will be hidden from patient search and booking will be disabled. Your data is preserved and you can reactivate at any time.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Type <span className="font-mono text-gray-900">{clinicName}</span> to confirm
              </label>
              <input
                value={confirmName}
                onChange={e => setConfirmName(e.target.value)}
                placeholder={clinicName}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100"
              />
            </div>
            <button
              disabled={!canDeactivate}
              className={cn(
                'w-full rounded-xl py-2.5 text-sm font-bold transition-all',
                canDeactivate
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              Deactivate Clinic
            </button>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Data export */}
          <div>
            <p className="text-sm font-semibold text-gray-900">Export Clinic Data</p>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">
              Download a complete export of your clinic data including appointments, patients, and analytics.
            </p>
            <button
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors opacity-60 cursor-not-allowed"
              disabled
              title="Coming soon"
            >
              Request Data Export (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClinicSettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [saved, setSaved] = useState(false)

  const { data: clinic, isLoading } = useQuery<ClinicDetail>({
    queryKey: ['clinic-detail'],
    queryFn: () => api.get(`/clinics/${user?.clinic_id}`).then(r => r.data),
    enabled: !!user?.clinic_id,
    staleTime: 120_000,
  })

  function handleSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (isLoading || !clinic) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 w-48 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">{clinic.name}</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="shrink-0 w-48 space-y-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all text-left',
                  activeTab === tab.key
                    ? tab.key === 'danger'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-700'
                    : tab.key === 'danger'
                    ? 'text-red-400 hover:bg-red-50/50 hover:text-red-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{tab.label}</span>
                {activeTab === tab.key && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
              </button>
            )
          })}
        </nav>

        {/* Content panel */}
        <div
          className="flex-1 bg-white rounded-2xl p-6"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          {activeTab === 'general' && (
            <GeneralTab clinic={clinic} onSaved={handleSaved} />
          )}
          {activeTab === 'contact' && (
            <ContactTab clinic={clinic} onSaved={handleSaved} />
          )}
          {activeTab === 'hours' && (
            <HoursTab clinic={clinic} onSaved={handleSaved} />
          )}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'danger' && <DangerTab clinicName={clinic.name} />}
        </div>
      </div>

      <SavedToast visible={saved} />
    </div>
  )
}
