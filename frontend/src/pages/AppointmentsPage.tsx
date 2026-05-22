import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import {
  AlertCircle, Calendar, CalendarPlus, Clock, MapPin,
  RefreshCw, Star, Stethoscope, XCircle,
} from 'lucide-react'
import { api } from '../lib/api'
import { ReviewModal } from '../components/ui/ReviewModal'
import type { Appointment } from '../types'

type Filter = 'upcoming' | 'past' | 'cancelled'

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   bg: '#FFFBEB', text: '#B45309' },
  confirmed: { label: 'Confirmed', bg: '#F0FDF4', text: '#15803D' },
  completed: { label: 'Completed', bg: '#F4F3EF', text: '#78716C' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
}

function AppointmentCard({ appt, showCancel, showReview }: { appt: Appointment; showCancel: boolean; showReview?: boolean }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cfg = STATUS_CFG[appt.status] ?? STATUS_CFG.pending
  const [reviewOpen, setReviewOpen] = useState(false)

  const { mutateAsync: cancelAppt, isPending } = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/appointments/${appt.id}/cancel`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    },
  })

  const dateStr = appt.appointment_date
    ? format(parseISO(appt.appointment_date), 'EEE, d MMM yyyy')
    : '—'
  const timeStr = appt.appointment_time?.substring(0, 5) ?? '—'

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-gray-100 transition-all hover:border-gray-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
    >
      {/* Date + time + status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-bold text-gray-900">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm text-gray-500 font-medium">{timeStr}</span>
          </div>
        </div>
        <span
          className="text-xs font-bold rounded-full px-2.5 py-1 shrink-0"
          style={{ backgroundColor: cfg.bg, color: cfg.text }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Doctor + clinic */}
      <div className="space-y-1 mb-3">
        {appt.doctor_name && (
          <div className="flex items-center gap-2">
            <Stethoscope className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-sm font-semibold text-gray-800">{appt.doctor_name}</span>
          </div>
        )}
        {appt.clinic_name && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500">{appt.clinic_name}</span>
          </div>
        )}
      </div>

      {/* Reason */}
      {appt.reason && (
        <p className="text-xs text-gray-400 mb-3 leading-relaxed border-l-2 border-gray-100 pl-2">
          {appt.reason}
        </p>
      )}

      {/* Reference + fee */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Ref</p>
          <p className="text-xs font-bold text-gray-700">{appt.booking_reference}</p>
        </div>
        {appt.amount_kes > 0 && (
          <p className="text-xs font-semibold text-gray-500">
            KES {appt.amount_kes.toLocaleString()}
          </p>
        )}
      </div>

      {/* Actions */}
      {(showCancel || showReview || appt.status === 'cancelled') && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
          {showCancel && appt.status !== 'cancelled' && (
            <button
              onClick={() => {
                if (confirm('Cancel this appointment?')) cancelAppt()
              }}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              {isPending ? 'Cancelling…' : 'Cancel'}
            </button>
          )}
          {showReview && (
            <button
              onClick={() => setReviewOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <Star className="h-3.5 w-3.5" /> Leave a Review
            </button>
          )}
          <button
            onClick={() => navigate(`/book/${appt.clinic_id}`)}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Rebook
          </button>
        </div>
      )}

      {reviewOpen && <ReviewModal appointment={appt} onClose={() => setReviewOpen(false)} />}
    </div>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const navigate = useNavigate()
  const msgs: Record<Filter, { title: string; sub: string }> = {
    upcoming: { title: 'No upcoming appointments', sub: 'Book one now to get started.' },
    past:     { title: 'No past appointments', sub: 'Your appointment history will appear here.' },
    cancelled:{ title: 'No cancelled appointments', sub: '' },
  }
  const { title, sub } = msgs[filter]
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Calendar className="h-7 w-7 text-gray-400" />
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {filter === 'upcoming' && (
        <button
          onClick={() => navigate('/clinics')}
          className="mt-5 flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: '#1E40AF' }}
        >
          <CalendarPlus className="h-4 w-4" /> Find a clinic
        </button>
      )}
    </div>
  )
}

export function AppointmentsPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('upcoming')

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['my-appointments', filter],
    queryFn: async () => {
      const { data } = await api.get('/appointments/my', { params: { filter } })
      return data
    },
  })

  const tabs: { key: Filter; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Appointments</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoading ? 'Loading…' : `${appointments.length} appointment${appointments.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => navigate('/clinics')}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E40AF' }}
        >
          <CalendarPlus className="h-4 w-4" /> Book new
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
              filter === t.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              showCancel={filter === 'upcoming'}
              showReview={appt.status === 'completed'}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {!isLoading && appointments.length > 0 && filter === 'upcoming' && (
        <div className="flex items-start gap-2 text-xs text-gray-400 pb-4">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Appointments can be cancelled up to 2 hours before the scheduled time.
        </div>
      )}
    </div>
  )
}
