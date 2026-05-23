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
  pending:   { bg: 'var(--color-warning-light)', text: 'var(--color-warning)', label: 'Pending' },
  confirmed: { bg: 'var(--color-brand-light)',   text: 'var(--color-brand)',   label: 'Confirmed' },
  completed: { bg: 'var(--color-success-light)', text: 'var(--color-success)', label: 'Completed' },
  cancelled: { bg: 'var(--color-surface-2)',     text: 'var(--color-text-tertiary)', label: 'Cancelled' },
}

const VARIANT = {
  brand:   { icon: 'var(--color-brand)',   bg: 'var(--color-brand-light)' },
  warning: { icon: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  success: { icon: 'var(--color-success)', bg: 'var(--color-success-light)' },
}

const METRICS = (s: ClinicStats) => [
  {
    label: "Today's appointments",
    value: s.appointments_today,
    sub: `${s.pending + s.confirmed} remaining`,
    icon: Calendar,
    variant: VARIANT.brand,
  },
  {
    label: 'Pending confirmation',
    value: s.pending,
    sub: `${s.confirmed} confirmed`,
    icon: Clock,
    variant: VARIANT.warning,
  },
  {
    label: 'Week revenue',
    value: formatKES(s.week_revenue_kes),
    sub: `${formatKES(s.total_revenue_kes)} total`,
    icon: TrendingUp,
    variant: VARIANT.success,
  },
  {
    label: 'Completion rate',
    value: `${s.completion_rate}%`,
    sub: `${s.completed} of ${s.total_appointments} total`,
    icon: CheckCircle2,
    variant: VARIANT.brand,
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
        <h1
          className="text-[22px] font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {stats?.clinic_name ?? 'Clinic Dashboard'}
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
          {new Date().toLocaleDateString('en-KE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
          {stats?.clinic_county ? ` · ${stats.clinic_county}` : ''}
        </p>
      </div>

      {/* Metrics strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {METRICS(stats).map(({ label, value, sub, icon: Icon, variant }) => (
            <div key={label} className="card p-4">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: variant.bg }}
              >
                <Icon className="h-4 w-4" style={{ color: variant.icon }} />
              </div>
              <p
                className="text-[22px] font-bold tracking-tight tabular-nums leading-none"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
              >
                {value}
              </p>
              <p className="text-[12px] font-medium mt-1 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
              {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Today's schedule — primary ops view */}
      <div className="card">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4" style={{ color: 'var(--color-brand)' }} />
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>Today's Schedule</p>
            <span
              className="text-[11px] font-semibold rounded-full px-2 py-0.5"
              style={{ color: 'var(--color-text-tertiary)', background: 'var(--color-surface-2)' }}
            >
              {todayAppts?.length ?? 0}
            </span>
          </div>
          <Link
            to="/clinic-dashboard/appointments"
            className="flex items-center gap-1 text-[12px] font-semibold transition-colors"
            style={{ color: 'var(--color-brand)' }}
          >
            Manage all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!todayAppts || todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--color-surface-2)' }}>
              <Calendar className="h-6 w-6" style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text-secondary)' }}>No appointments today</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Enjoy the quiet — or check tomorrow's schedule
            </p>
          </div>
        ) : (
          <div>
            {todayAppts.map(appt => {
              const chip = STATUS_CHIP[appt.status] ?? STATUS_CHIP.pending
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="w-12 shrink-0">
                    <p className="text-[13px] font-bold tabular-nums" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {appt.appointment_time?.substring(0, 5)}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {appt.patient_name}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                      {appt.doctor_name ?? 'Unassigned'}
                      {appt.reason ? ` · ${appt.reason}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {appt.amount_kes > 0 && (
                      <span className="text-[12px] font-medium hidden sm:block" style={{ color: 'var(--color-text-tertiary)' }}>
                        {formatKES(appt.amount_kes)}
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
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
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--color-warning)' }} />
            <p className="text-[12px]" style={{ color: 'var(--color-warning)' }}>
              {stats.pending} appointment{stats.pending !== 1 ? 's' : ''} awaiting confirmation
            </p>
          </div>
        )}
      </div>

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}>Appointment Trend</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>Last 8 weeks</p>
            </div>
            <Link
              to="/clinic-dashboard/analytics"
              className="text-[12px] font-semibold transition-colors"
              style={{ color: 'var(--color-brand)' }}
            >
              Full analytics
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#D1D5DB' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '12px',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#1D4ED8"
                strokeWidth={2}
                fill="url(#apptGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#1D4ED8' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
