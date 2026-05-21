import { useQuery } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { Activity, Calendar, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { api } from '../lib/api'

interface DashStats {
  clinic_name: string
  clinic_county: string
  appointments_today: number
  pending: number
  confirmed: number
  completed: number
  total_appointments: number
}

const DEMO_RECENT = [
  { patient: 'Jane Wanjiku',    reason: 'Malaria follow-up',   time: '09:00', status: 'confirmed' },
  { patient: 'Brian Otieno',    reason: 'Diabetes review',     time: '09:30', status: 'confirmed' },
  { patient: 'Amina Hassan',    reason: 'Fever + headache',    time: '10:00', status: 'pending'   },
  { patient: 'Samuel Mwangi',   reason: 'Chest pain eval',     time: '11:00', status: 'pending'   },
  { patient: 'Grace Njoroge',   reason: 'Antenatal checkup',   time: '13:00', status: 'completed' },
]

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  confirmed: { backgroundColor: '#f0fdf4', color: '#15803d' },
  pending:   { backgroundColor: '#fffbeb', color: '#b45309' },
  completed: { backgroundColor: '#f4f3ef', color: '#78716c' },
}

export function ClinicDashboardPage() {
  const { user } = useAuthStore()

  if (user?.role !== 'clinic_admin' && user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />
  }

  const { data: stats } = useQuery<DashStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data
    },
  })

  const clinicName = stats?.clinic_name ?? 'Your Clinic'

  return (
    <div className="space-y-7 animate-fade-in">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-1">
          Clinic Dashboard
        </p>
        <h1 className="text-2xl font-extrabold text-[#1a1a18] tracking-tight">{clinicName}</h1>
        <p className="text-sm text-stone-400 mt-1">
          {stats?.clinic_county} · Today's overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Today',     value: stats?.appointments_today ?? 0, icon: Calendar,   color: '#1d4ed8', bg: '#eff6ff' },
          { label: 'Pending',   value: stats?.pending           ?? 0, icon: Clock,      color: '#b45309', bg: '#fffbeb' },
          { label: 'Confirmed', value: stats?.confirmed         ?? 0, icon: CheckCircle, color: '#15803d', bg: '#f0fdf4' },
          { label: 'Completed', value: stats?.completed         ?? 0, icon: TrendingUp,  color: '#7c3aed', bg: '#f5f3ff' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4 animate-slide-up"
            style={{
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              animationDelay: `${i * 0.06}s`,
              opacity: 0,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1a1a18]">{value}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Total patients stat */}
      <div
        className="bg-white rounded-2xl p-5 flex items-center gap-4 animate-slide-up"
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          animationDelay: '0.24s',
          opacity: 0,
        }}
      >
        <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-black text-[#1a1a18]">{stats?.total_appointments ?? 0}</p>
          <p className="text-xs text-stone-400">Total appointments all time</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-green-600">+12%</p>
          <p className="text-[10px] text-stone-400">vs last month</p>
        </div>
      </div>

      {/* Recent appointments */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          Today's appointments
        </p>
        <div
          className="bg-white rounded-2xl overflow-hidden animate-slide-up"
          style={{
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            animationDelay: '0.30s',
            opacity: 0,
          }}
        >
          {DEMO_RECENT.map((appt, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-stone-50"
              style={i > 0 ? { borderTop: '1px solid #f4f3ef' } : {}}
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-stone-100 flex items-center justify-center">
                <span className="text-xs font-bold text-stone-500">
                  {appt.patient.split(' ').map(w => w[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1a18] truncate">{appt.patient}</p>
                <p className="text-xs text-stone-400 truncate">{appt.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-stone-600">{appt.time}</p>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={STATUS_STYLES[appt.status]}
                >
                  {appt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue teaser */}
      <div
        className="rounded-2xl p-5 animate-slide-up"
        style={{
          background: 'linear-gradient(135deg, #0d1f10 0%, #1a4228 100%)',
          animationDelay: '0.36s',
          opacity: 0,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Activity className="h-5 w-5 text-green-400" />
          <p className="text-sm font-bold text-white">Revenue Analytics</p>
        </div>
        <p className="text-2xl font-black text-white">KES 48,500</p>
        <p className="text-xs text-white/50 mt-0.5">This month · from appointments</p>
        <div className="mt-4 h-1.5 rounded-full bg-white/10">
          <div className="h-full w-3/4 rounded-full bg-green-400" />
        </div>
        <p className="text-[10px] text-white/40 mt-1.5">75% of monthly target</p>
      </div>

    </div>
  )
}
