import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Building2, Calendar, Clock, Mail,
  MapPin, Phone, ShieldCheck, Stethoscope, User2,
} from 'lucide-react'
import { api } from '../lib/api'
import type { ClinicDetail, Doctor } from '../types'

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

function DoctorCard({ doctor, clinicId }: { doctor: Doctor; clinicId: string }) {
  const navigate = useNavigate()
  const initials = doctor.full_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col gap-4 transition-all hover:border-blue-200 hover:shadow-sm"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ backgroundColor: '#1E40AF' }}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{doctor.full_name}</p>
          <p className="text-xs text-blue-600 font-semibold">{doctor.specialty}</p>
        </div>
      </div>

      {/* Qualification */}
      {doctor.qualification && (
        <p className="text-xs text-gray-500 leading-relaxed">{doctor.qualification}</p>
      )}

      {/* Bio */}
      {doctor.bio && (
        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{doctor.bio}</p>
      )}

      {/* Available days */}
      {doctor.available_days?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {DAY_ORDER.filter(d => doctor.available_days.includes(d)).map(d => (
            <span key={d} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              {DAY_LABELS[d]}
            </span>
          ))}
        </div>
      )}

      {/* Fee + Book */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-auto">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Consultation</p>
          <p className="text-sm font-bold text-gray-900">
            KES {doctor.consultation_fee_kes.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => navigate(`/book/${clinicId}?doctor=${doctor.id}`)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#1E40AF' }}
        >
          <Calendar className="h-3.5 w-3.5" />
          Book
        </button>
      </div>
    </div>
  )
}

function OperatingHours({ hours }: { hours: Record<string, { open: string; close: string }> }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      {DAY_ORDER.map(day => {
        const slot = hours[day]
        const isToday = day === today
        return (
          <div
            key={day}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm ${
              isToday ? 'bg-blue-50' : 'bg-gray-50'
            }`}
          >
            <span className={`font-semibold capitalize ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
              {day.slice(0, 3).charAt(0).toUpperCase() + day.slice(0, 3).slice(1)}
              {isToday && <span className="ml-1 text-[10px] font-bold text-blue-500">Today</span>}
            </span>
            {slot ? (
              <span className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                {slot.open} – {slot.close}
              </span>
            ) : (
              <span className="text-xs text-gray-400 italic">Closed</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ClinicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: clinic, isLoading } = useQuery<ClinicDetail>({
    queryKey: ['clinic', id],
    queryFn: async () => {
      const { data } = await api.get(`/clinics/${id}`)
      return data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!clinic) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Building2 className="h-10 w-10 text-gray-300 mb-4" />
        <p className="text-gray-500 font-semibold">Clinic not found</p>
        <button onClick={() => navigate('/clinics')} className="mt-4 text-sm text-blue-600 font-semibold">
          Back to clinics
        </button>
      </div>
    )
  }

  const activeDoctors = clinic.doctors?.filter(d => d.is_active) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate('/clinics')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clinics
      </button>

      {/* Clinic hero card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: '#EFF6FF' }}
          >
            <Building2 className="h-7 w-7 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{clinic.name}</h1>
              {clinic.is_verified && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2.5 py-0.5">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 rounded-full px-2.5 py-0.5">
                {clinic.county}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {clinic.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {clinic.phone}
              </div>
              {clinic.email && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  {clinic.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {clinic.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-50">
            {clinic.specialties.map(s => (
              <span key={s} className="text-xs font-medium rounded-full px-3 py-1 bg-blue-50 text-blue-700">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Operating hours */}
      {Object.keys(clinic.operating_hours || {}).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">Operating Hours</h2>
          </div>
          <OperatingHours hours={clinic.operating_hours} />
        </div>
      )}

      {/* Doctors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-900">
              Our Doctors
              {activeDoctors.length > 0 && (
                <span className="ml-1.5 text-xs font-semibold text-gray-400">
                  ({activeDoctors.length})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={() => navigate(`/book/${clinic.id}`)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#1E40AF' }}
          >
            Book Appointment
          </button>
        </div>

        {activeDoctors.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center bg-white rounded-2xl border border-gray-100">
            <User2 className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No doctors listed yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeDoctors.map(doctor => (
              <DoctorCard key={doctor.id} doctor={doctor} clinicId={clinic.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
