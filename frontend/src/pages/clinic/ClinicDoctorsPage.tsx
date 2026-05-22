import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, X, Search, Stethoscope, Calendar, BadgeCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import { formatKES, cn } from '../../lib/utils'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SPECIALTIES = [
  'General Practice', 'Pediatrics', 'Gynecology & Obstetrics', 'Internal Medicine',
  'General Surgery', 'Dermatology', 'Orthopedics', 'Cardiology', 'Neurology',
  'Ophthalmology', 'ENT', 'Psychiatry', 'Radiology', 'Oncology', 'Urology',
]

interface DashboardDoctor {
  id: string
  full_name: string
  specialty: string
  qualification: string | null
  available_days: string[]
  consultation_fee_kes: number
  is_active: boolean
}

interface DoctorFormData {
  full_name: string
  specialty: string
  qualification: string
  bio: string
  consultation_fee_kes: number
}

function DoctorAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  return (
    <div
      style={{ width: size, height: size, fontSize: size < 40 ? 12 : 15 }}
      className="shrink-0 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 font-extrabold"
    >
      {initials}
    </div>
  )
}

function DoctorCard({ doctor }: { doctor: DashboardDoctor }) {
  return (
    <div
      className="bg-white rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-start gap-3.5">
        <DoctorAvatar name={doctor.full_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-gray-900 leading-tight">{doctor.full_name}</p>
            <span
              className={cn(
                'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                doctor.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500',
              )}
            >
              {doctor.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs text-blue-600 font-medium mt-0.5">{doctor.specialty}</p>
          {doctor.qualification && (
            <p className="text-[11px] text-gray-400 mt-0.5">{doctor.qualification}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Consultation</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">{formatKES(doctor.consultation_fee_kes)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Availability</p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">
            {doctor.available_days.length > 0 ? `${doctor.available_days.length} days/week` : 'Not set'}
          </p>
        </div>
      </div>

      {doctor.available_days.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {doctor.available_days.map(day => (
            <span
              key={day}
              className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wide"
            >
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function AddDoctorModal({ clinicId, onClose }: { clinicId: string; onClose: () => void }) {
  const qc = useQueryClient()
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const { register, handleSubmit, formState: { errors } } = useForm<DoctorFormData>({
    defaultValues: { consultation_fee_kes: 1500 },
  })

  const mutation = useMutation({
    mutationFn: (data: DoctorFormData) =>
      api.post(`/clinics/${clinicId}/doctors`, { ...data, available_days: selectedDays }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-doctors'] })
      onClose()
    },
  })

  function toggleDay(day: string) {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <h2 className="text-base font-bold text-gray-900">Add New Doctor</h2>
            <p className="text-xs text-gray-500 mt-0.5">Immediately available for patient bookings</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(data => mutation.mutate(data))}
          className="p-6 space-y-4 overflow-y-auto max-h-[65vh]"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
            <input
              {...register('full_name', { required: 'Required' })}
              placeholder="Dr. Jane Kamau"
              className={cn(
                'w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1',
                errors.full_name
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                  : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100',
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Specialty *</label>
              <select
                {...register('specialty', { required: 'Required' })}
                className={cn(
                  'w-full rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1',
                  errors.specialty
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100',
                )}
              >
                <option value="">Select…</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Qualification</label>
              <input
                {...register('qualification')}
                placeholder="MBChB, MMed"
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Consultation Fee (KES)
            </label>
            <input
              type="number"
              {...register('consultation_fee_kes', { valueAsNumber: true, min: 0 })}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Professional Bio</label>
            <textarea
              {...register('bio')}
              placeholder="Brief professional background…"
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Available Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    selectedDays.includes(day)
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              Failed to add doctor. Please try again.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: '#1E40AF' }}
            >
              {mutation.isPending ? 'Adding…' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ClinicDoctorsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data: doctors = [], isLoading } = useQuery<DashboardDoctor[]>({
    queryKey: ['clinic-doctors'],
    queryFn: () => api.get('/dashboard/doctors').then(r => r.data),
    staleTime: 60_000,
  })

  const filtered = doctors.filter(d =>
    !search ||
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase()),
  )

  const activeCount = doctors.filter(d => d.is_active).length

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Doctors</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeCount} active · {doctors.length} total
          </p>
        </div>
        {user?.clinic_id && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#1E40AF' }}
          >
            <Plus className="h-4 w-4" />
            Add Doctor
          </button>
        )}
      </div>

      {/* Search + stats row */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or specialty…"
            className="w-64 rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div className="flex gap-3 ml-auto">
          {[
            { label: 'Total', val: doctors.length, color: '#1E40AF' },
            { label: 'Active', val: activeCount, color: '#059669' },
            { label: 'Inactive', val: doctors.length - activeCount, color: '#6B7280' },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white rounded-xl px-4 py-2.5 text-center"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              <p className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-white rounded-2xl" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Stethoscope className="h-7 w-7 text-blue-400" />
          </div>
          <p className="text-sm font-bold text-gray-700">
            {search ? 'No matching doctors' : 'No doctors yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1 max-w-[280px]">
            {search
              ? 'Try a different name or specialty.'
              : 'Add your first doctor to enable patient bookings.'}
          </p>
          {!search && user?.clinic_id && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: '#1E40AF' }}
            >
              <Plus className="h-4 w-4" /> Add Doctor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}

      {/* Verification note */}
      {doctors.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
          <BadgeCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Doctor verification</p>
            <p className="text-xs text-blue-600 mt-0.5">
              All doctors are visible to patients immediately after being added. Ensure credentials are verified before adding.
            </p>
          </div>
        </div>
      )}

      {showModal && user?.clinic_id && (
        <AddDoctorModal clinicId={user.clinic_id} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
