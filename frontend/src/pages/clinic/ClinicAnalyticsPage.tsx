import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import { api } from '../../lib/api'

interface Analytics {
  weekly_trend: { label: string; appointments: number; revenue: number }[]
  monthly_revenue: { month: string; revenue: number }[]
  top_symptoms: { symptom: string; count: number }[]
  peak_hours: { hour: string; bookings: number }[]
  completion_rate: number
}

function SectionCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}>
      <div className="mb-5">
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">{sub}</p>
      </div>
      {children}
    </div>
  )
}

const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #eceae4',
  fontSize: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}

const AXIS_TICK = { fontSize: 11, fill: '#9CA3AF' }

export function ClinicAnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['clinic-analytics'],
    queryFn: () => api.get('/dashboard/analytics').then(r => r.data),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-72 rounded-2xl bg-gray-200" />)}
        </div>
      </div>
    )
  }

  const { weekly_trend = [], monthly_revenue = [], top_symptoms = [], peak_hours = [], completion_rate = 0 } = analytics ?? {}

  // Format revenue for tooltips
  const formatRev = (v: number) => `KES ${v.toLocaleString()}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Performance insights for your clinic</p>
      </div>

      {/* Completion rate banner */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center justify-between"
        style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}
      >
        <div>
          <p className="text-[13px] text-gray-500 font-medium">Overall completion rate</p>
          <p className="text-3xl font-bold text-gray-900 mt-0.5">{completion_rate}%</p>
        </div>
        <div className="w-48 h-3 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${completion_rate}%`, backgroundColor: '#059669' }}
          />
        </div>
      </div>

      {/* 2-column chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Revenue */}
        <SectionCard title="Monthly Revenue" sub="Last 6 months (KES)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly_revenue} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
              <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [formatRev(v as number), 'Revenue']} />
              <Bar dataKey="revenue" fill="#1E40AF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Weekly Appointment Trend */}
        <SectionCard title="Weekly Appointments" sub="Last 8 weeks">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weekly_trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke="#1E40AF"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#1E40AF' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Top Symptoms */}
        <SectionCard title="Top Symptoms" sub="By county — anonymised data">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={top_symptoms.slice(0, 8)}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" horizontal={false} />
              <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="symptom" tick={{ ...AXIS_TICK, textAnchor: 'end' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {top_symptoms.slice(0, 8).map((_, i) => {
                  const palette = ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF']
                  return <Cell key={i} fill={palette[i] ?? '#EFF6FF'} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Peak Hours */}
        <SectionCard title="Peak Booking Hours" sub="Typical daily volume pattern">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={peak_hours} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ec" vertical={false} />
              <XAxis dataKey="hour" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [v as number, 'Bookings']} />
              <Area
                type="monotone"
                dataKey="bookings"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#peakGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#059669' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </div>
  )
}
