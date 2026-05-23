import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Calendar, TrendingUp, Clock, CheckCircle2,
  ChevronRight, AlertCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatKES } from '../../lib/utils'

interface ClinicStats {
  role: string
  clinic_name: string | null
  clinic_county: string | null
  appointments_today: number
  pending: number
  confirmed: number
  completed: number
  total_appointments: number
  total_revenue_kes: number
  week_revenue_kes: number
  pending_orders: number
  completion_rate: number
}

interface WeeklyTrend {
  label: string
  appointments: number
  revenue: number
}

interface Analytics {
  weekly_trend: WeeklyTrend[]
}

interface DashboardAppointment {
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

const STATUS_CHIP: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed' },
  completed: { bg: '#D1FAE5', text: '#065F46', label: 'Completed' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
}

const METRICS = (s: ClinicStats) => [
  {
    label: "Today's appointments",
    value: s.appointments_today,
    sub: `${s.pending + s.confirmed} remaining`,
    icon: Calendar,
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    label: 'Pending confirmation',
    value: s.pending,
    sub: `${s.confirmed} confirmed`,
    icon: Clock,
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    label: 'Week revenue',
    value: formatKES(s.week_revenue_kes),
    sub: `${formatKES(s.total_revenue_kes)} total`,
    icon: TrendingUp,
    color: '#059669',
    bg: '#F0FDF4',
  },
  {
    label: 'Completion rate',
    value: `${s.completion_rate}%`,
    sub: `${s.completed} of ${s.total_appointments} total`,
    icon: CheckCircle2,
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
]

export function ClinicOverviewPage() {
  const today = new Date().toISOString().split('T')[0]

  const { data: stats, isLoading } = useQuery<ClinicStats>({
    queryKey: ['clinic-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
  })

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ['clinic-analytics'],
    queryFn: () => api.get('/dashboard/analytics').then(r => r.data),
  })

  const { data: todayAppts } = useQuery<DashboardAppointment[]>({
    queryKey: ['clinic-appointments', today],
    queryFn: () =>
      api.get('/dashboard/appointments', { params: { date: today, limit: 20 } }).then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-7 w-56 bg-gray-200 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  const trendData = analytics?.weekly_trend ?? []

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
          {stats?.clinic_name ?? 'Clinic Dashboard'}
        </h1>
        <p className="text-[13px] text-slate-400 mt-0.5">
          {new Date().toLocaleDateString('en-KE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
          {stats?.clinic_county ? ` · ${stats.clinic_county}` : ''}
        </p>
      </div>

      {/* Metrics strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS(stats).map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200/80 p-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: bg }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <p className="text-[22px] font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                {value}
              </p>
              <p className="text-[12px] text-slate-500 font-medium mt-1 leading-snug">{label}</p>
              {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Today's schedule — primary ops view */}
      <div className="bg-white rounded-xl border border-slate-200/80">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #F1F5F9' }}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-blue-500" />
            <p className="text-[14px] font-bold text-slate-900">Today's Schedule</p>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              {todayAppts?.length ?? 0}
            </span>
          </div>
          <Link
            to="/clinic-dashboard/appointments"
            className="flex items-center gap-1 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Manage all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!todayAppts || todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-[13px] font-semibold text-slate-500">No appointments today</p>
            <p className="text-[12px] text-slate-400 mt-1">
              Enjoy the quiet — or check tomorrow's schedule
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {todayAppts.map(appt => {
              const chip = STATUS_CHIP[appt.status] ?? STATUS_CHIP.pending
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="w-12 shrink-0">
                    <p className="text-[13px] font-bold text-slate-900 tabular-nums">
                      {appt.appointment_time?.substring(0, 5)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">
                      {appt.patient_name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {appt.doctor_name ?? 'Unassigned'}
                      {appt.reason ? ` · ${appt.reason}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {appt.amount_kes > 0 && (
                      <span className="text-[12px] font-medium text-slate-400 hidden sm:block">
                        {formatKES(appt.amount_kes)}
                      </span>
                    )}
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: chip.bg, color: chip.text }}
                    >
                      {chip.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {stats && stats.pending > 0 && (
          <div
            className="flex items-center gap-2 px-5 py-3"
            style={{ borderTop: '1px solid #F1F5F9' }}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <p className="text-[12px] text-amber-700">
              {stats.pending} appointment{stats.pending !== 1 ? 's' : ''} awaiting confirmation
            </p>
          </div>
        )}
      </div>

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[14px] font-bold text-slate-900">Appointment Trend</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Last 8 weeks</p>
            </div>
            <Link
              to="/clinic-dashboard/analytics"
              className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Full analytics
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#CBD5E1' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#apptGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#2563EB' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
