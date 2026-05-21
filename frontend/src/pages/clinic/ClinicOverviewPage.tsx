import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { Calendar, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react'
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

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed' },
  completed: { bg: '#D1FAE5', text: '#065F46', label: 'Completed' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled' },
}

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}
    >
      <div className="flex items-start justify-between">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
      <div>
        <p className="text-[13px] text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export function ClinicOverviewPage() {
  const today = new Date().toISOString().split('T')[0]

  const { data: stats, isLoading: statsLoading } = useQuery<ClinicStats>({
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
      api.get('/dashboard/appointments', { params: { date: today, limit: 10 } }).then(r => r.data),
  })

  if (statsLoading) {
    return (
      <div className="px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-gray-200" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const trendData = analytics?.weekly_trend ?? []

  return (
    <div className="px-8 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {stats?.clinic_name ?? 'Clinic Dashboard'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats?.clinic_county ? `${stats.clinic_county} · ` : ''}
          {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Today's Appointments"
          value={stats?.appointments_today ?? 0}
          sub={`${(stats?.pending ?? 0) + (stats?.confirmed ?? 0)} remaining`}
          icon={Calendar}
          accent="#1E40AF"
        />
        <StatCard
          label="Week Revenue"
          value={formatKES(stats?.week_revenue_kes ?? 0)}
          sub={`Total: ${formatKES(stats?.total_revenue_kes ?? 0)}`}
          icon={TrendingUp}
          accent="#059669"
        />
        <StatCard
          label="Pending"
          value={stats?.pending ?? 0}
          sub={`${stats?.confirmed ?? 0} confirmed`}
          icon={Clock}
          accent="#D97706"
        />
        <StatCard
          label="Completion Rate"
          value={`${stats?.completion_rate ?? 0}%`}
          sub={`${stats?.completed ?? 0} of ${stats?.total_appointments ?? 0} total`}
          icon={CheckCircle2}
          accent="#7C3AED"
        />
      </div>

      {/* Charts + appointments row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Trend chart */}
        <div
          className="lg:col-span-3 rounded-2xl p-6"
          style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Appointment Trend</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Last 8 weeks</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #eceae4',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="#1E40AF"
                strokeWidth={2}
                fill="url(#apptGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#1E40AF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Today's appointments */}
        <div
          className="lg:col-span-2 rounded-2xl flex flex-col"
          style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #f1f0ec' }}>
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Today</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {stats?.appointments_today ?? 0} appointment{stats?.appointments_today !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/clinic-dashboard/appointments"
              className="flex items-center gap-1 text-[12px] font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-3">
            {!todayAppts || todayAppts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-8 w-8 text-gray-200 mb-2" />
                <p className="text-[13px] text-gray-400">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayAppts.map(appt => {
                  const s = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending
                  return (
                    <div key={appt.id} className="flex items-center gap-3">
                      <div className="text-center shrink-0 w-10">
                        <p className="text-[12px] font-bold text-gray-900">{appt.appointment_time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 truncate">{appt.patient_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{appt.doctor_name ?? 'Unassigned'}</p>
                      </div>
                      <span
                        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: s.bg, color: s.text }}
                      >
                        {s.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'All Appointments', to: '/clinic-dashboard/appointments', sub: 'Manage bookings' },
          { label: 'Analytics', to: '/clinic-dashboard/analytics', sub: 'Revenue & trends' },
          { label: 'Subscription', to: '/clinic-dashboard/subscription', sub: 'Manage your plan' },
          { label: 'Find Clinics', to: '/clinics', sub: 'Browse the network' },
        ].map(({ label, to, sub }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl p-4 flex items-center justify-between group transition-all hover:shadow-sm"
            style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}
          >
            <div>
              <p className="text-[13px] font-semibold text-gray-900">{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
