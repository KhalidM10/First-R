import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Users, Search, Calendar, ChevronRight, Clock } from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

interface DashboardAppt {
  id: string
  patient_name: string
  appointment_date: string
  appointment_time: string
  status: string
  reason: string | null
  amount_kes: number
  booking_reference: string
  doctor_name: string | null
}

interface PatientSummary {
  name: string
  totalVisits: number
  lastVisit: string
  lastStatus: string
  totalSpentKes: number
  upcomingCount: number
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  completed: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
}

function PatientRow({ patient, onSelect, selected }: {
  patient: PatientSummary
  onSelect: () => void
  selected: boolean
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors',
        selected ? 'bg-blue-50' : 'hover:bg-gray-50',
      )}
    >
      <div
        className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-extrabold"
        style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
      >
        {patient.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{patient.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Last visit: {format(parseISO(patient.lastVisit), 'd MMM yyyy')}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-gray-900">{patient.totalVisits}</p>
        <p className="text-[10px] text-gray-400">visits</p>
      </div>

      <span
        className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
        style={STATUS_COLOR[patient.lastStatus] ?? { bg: '#F3F4F6', text: '#374151' }}
      >
        {patient.lastStatus}
      </span>

      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </button>
  )
}

function PatientDetail({ patient, appointments }: {
  patient: PatientSummary
  appointments: DashboardAppt[]
}) {
  const patientAppts = appointments
    .filter(a => a.patient_name === patient.name)
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))

  return (
    <div className="p-6 space-y-5">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-extrabold"
          style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
        >
          {patient.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900">{patient.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{patient.totalVisits} total appointments</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Visits', val: patient.totalVisits.toString(), color: '#1E40AF' },
          { label: 'Upcoming', val: patient.upcomingCount.toString(), color: '#059669' },
          { label: 'Spent (KES)', val: patient.totalSpentKes.toLocaleString(), color: '#D97706' },
        ].map(s => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ backgroundColor: '#F8FAFC' }}
          >
            <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Appointment history */}
      <div>
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
          Appointment History
        </h4>
        <div className="space-y-2">
          {patientAppts.map(appt => (
            <div
              key={appt.id}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ backgroundColor: '#F8FAFC' }}
            >
              <div className="mt-0.5">
                <Calendar className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800">
                    {format(parseISO(appt.appointment_date), 'd MMM yyyy')} · {appt.appointment_time}
                  </p>
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={STATUS_COLOR[appt.status] ?? { bg: '#F3F4F6', text: '#374151' }}
                  >
                    {appt.status}
                  </span>
                </div>
                {appt.doctor_name && (
                  <p className="text-[11px] text-gray-500 mt-0.5">Dr. {appt.doctor_name}</p>
                )}
                {appt.reason && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{appt.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ClinicPatientsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const { data: appointments = [], isLoading } = useQuery<DashboardAppt[]>({
    queryKey: ['clinic-appointments-patients'],
    queryFn: () => api.get('/dashboard/appointments', { params: { limit: 200 } }).then(r => r.data),
    staleTime: 60_000,
  })

  const patients = useMemo<PatientSummary[]>(() => {
    const map = new Map<string, PatientSummary>()
    const today = new Date().toISOString().slice(0, 10)
    for (const appt of appointments) {
      const name = appt.patient_name
      const existing = map.get(name)
      const isUpcoming = appt.appointment_date >= today && appt.status !== 'cancelled'
      if (!existing) {
        map.set(name, {
          name,
          totalVisits: 1,
          lastVisit: appt.appointment_date,
          lastStatus: appt.status,
          totalSpentKes: appt.status === 'completed' ? appt.amount_kes : 0,
          upcomingCount: isUpcoming ? 1 : 0,
        })
      } else {
        existing.totalVisits += 1
        if (appt.appointment_date > existing.lastVisit) {
          existing.lastVisit = appt.appointment_date
          existing.lastStatus = appt.status
        }
        if (appt.status === 'completed') existing.totalSpentKes += appt.amount_kes
        if (isUpcoming) existing.upcomingCount += 1
      }
    }
    return [...map.values()].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
  }, [appointments])

  const filtered = patients.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedPatient = patients.find(p => p.name === selected) ?? null

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Patients</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {patients.length} unique patients from appointment history
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Total', val: patients.length, color: '#1E40AF' },
            {
              label: 'With Upcoming',
              val: patients.filter(p => p.upcomingCount > 0).length,
              color: '#059669',
            },
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

      {/* Two-panel layout */}
      <div
        className="bg-white rounded-2xl overflow-hidden flex"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', minHeight: 480 }}
      >
        {/* Left: list */}
        <div className="w-80 shrink-0 flex flex-col" style={{ borderRight: '1px solid #F1F5F9' }}>
          <div className="p-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patients…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center px-4">
                <Users className="h-8 w-8 text-gray-300 mb-3" />
                <p className="text-xs font-semibold text-gray-500">
                  {search ? 'No matching patients' : 'No patient data yet'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {search ? 'Try a different name.' : 'Patients appear after their first appointment.'}
                </p>
              </div>
            ) : (
              filtered.map(patient => (
                <PatientRow
                  key={patient.name}
                  patient={patient}
                  selected={selected === patient.name}
                  onSelect={() => setSelected(prev => prev === patient.name ? null : patient.name)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedPatient ? (
            <PatientDetail patient={selectedPatient} appointments={appointments} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: '#F8FAFC' }}
              >
                <Users className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">Select a patient</p>
              <p className="text-xs text-gray-400 mt-1">
                Click any patient to view their appointment history and details.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Clock className="h-3.5 w-3.5" />
        <span>Patient records are derived from appointment history. Last 200 appointments shown.</span>
      </div>
    </div>
  )
}
