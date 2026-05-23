import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Users, Building2, Activity, Calendar, DollarSign,
  TrendingUp, Wifi, AlertTriangle, CheckCircle2,
  ShieldAlert, UserPlus, Store, Stethoscope,
} from 'lucide-react'
import { api } from '../../lib/api'
import { formatKES } from '../../lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface PlatformStats {
  total_users: number
  total_clinics: number
  verified_clinics: number
  pending_clinics: number
  suspended_clinics: number
  triage_today: number
  triage_week: number
  triage_total: number
  appointments_completed: number
  appointments_total: number
  cancellation_rate: number
  total_revenue_kes: number
  mrr_kes: number
  active_sessions: number
}

interface LiveEvent {
  id: string
  ts: string
  type: string
  actor: string
  description: string
  risk: 'low' | 'medium' | 'high'
}

interface WeeklyPoint { label: string; users: number; revenue: number; triage: number }

// ── Mock / seed data ─────────────────────────────────────────────────────────

const MOCK_STATS: PlatformStats = {
  total_users: 12_847,
  total_clinics: 234,
  verified_clinics: 189,
  pending_clinics: 31,
  suspended_clinics: 14,
  triage_today: 847,
  triage_week: 5_123,
  triage_total: 98_441,
  appointments_completed: 41_227,
  appointments_total: 49_033,
  cancellation_rate: 15.9,
  total_revenue_kes: 14_720_000,
  mrr_kes: 1_248_000,
  active_sessions: 314,
}

const WEEKLY_TREND: WeeklyPoint[] = [
  { label: 'Mon', users: 1840, revenue: 168000, triage: 712 },
  { label: 'Tue', users: 2105, revenue: 192000, triage: 834 },
  { label: 'Wed', users: 1978, revenue: 178000, triage: 791 },
  { label: 'Thu', users: 2340, revenue: 213000, triage: 920 },
  { label: 'Fri', users: 2712, revenue: 248000, triage: 1082 },
  { label: 'Sat', users: 1534, revenue: 142000, triage: 613 },
  { label: 'Sun', users: 1122, revenue: 107000, triage: 447 },
]

const EVENT_TEMPLATES: Omit<LiveEvent, 'id' | 'ts'>[] = [
  { type: 'login',        actor: 'john.mwangi@gmail.com',    description: 'User login from Nairobi (KE)',         risk: 'low' },
  { type: 'register',     actor: 'mercy.wanjiku@yahoo.com',  description: 'New patient registered',              risk: 'low' },
  { type: 'booking',      actor: 'City Eye Clinic',          description: 'Appointment booked — Dr. Omondi',     risk: 'low' },
  { type: 'failed_login', actor: '41.90.xxx.xxx',            description: '3 failed login attempts',             risk: 'medium' },
  { type: 'role_change',  actor: 'admin@medassist.ai',       description: 'Role changed: patient → clinic_admin', risk: 'high' },
  { type: 'impersonate',  actor: 'admin@medassist.ai',       description: 'Impersonated user achieng@clinic.ke', risk: 'high' },
  { type: 'triage',       actor: 'patient#8821',             description: 'Triage session: fever + headache',    risk: 'low' },
  { type: 'order',        actor: 'Nairobi Pharmacy Plus',    description: 'Medicine order KES 3,450 processed',  risk: 'low' },
  { type: 'verify',       actor: 'admin@medassist.ai',       description: 'Clinic verified: Kisumu Health Ctr',  risk: 'low' },
  { type: 'suspend',      actor: 'admin@medassist.ai',       description: 'Clinic suspended: fraudulent billing', risk: 'high' },
]

const RISK_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  low:    { bg: 'rgba(16,185,129,0.08)', text: '#059669', dot: '#10B981' },
  medium: { bg: 'rgba(245,158,11,0.08)', text: '#D97706', dot: '#F59E0B' },
  high:   { bg: 'rgba(239,68,68,0.08)',  text: '#DC2626', dot: '#EF4444' },
}

const EVENT_ICON: Record<string, React.ElementType> = {
  login:        Wifi,
  register:     UserPlus,
  booking:      Calendar,
  failed_login: AlertTriangle,
  role_change:  ShieldAlert,
  impersonate:  ShieldAlert,
  triage:       Activity,
  order:        Store,
  verify:       CheckCircle2,
  suspend:      AlertTriangle,
}

let _eid = 0

function makeEvent(): LiveEvent {
  const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)]
  return { ...tpl, id: String(++_eid), ts: new Date().toISOString() }
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Metric({
  label, value, sub, icon: Icon, variant = 'brand', delta,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; variant?: 'brand' | 'success' | 'danger' | 'warning'; delta?: string
}) {
  const COLOR = {
    brand:   { icon: 'var(--color-brand)',   bg: 'var(--color-brand-light)' },
    success: { icon: 'var(--color-success)', bg: 'var(--color-success-light)' },
    danger:  { icon: 'var(--color-danger)',  bg: 'var(--color-danger-light)' },
    warning: { icon: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
  }[variant]

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          >
            {label}
          </p>
          <p
            className="text-[24px] font-bold mt-1.5 tracking-tight tabular-nums"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
          >
            {value}
          </p>
          {sub && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
              {sub}
            </p>
          )}
          {delta && (
            <p
              className="text-[11px] font-semibold mt-1"
              style={{ color: delta.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)', fontFamily: 'var(--font-body)' }}
            >
              {delta} vs last week
            </p>
          )}
        </div>
        <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLOR.bg }}>
          <Icon className="h-5 w-5" style={{ color: COLOR.icon }} />
        </div>
      </div>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export function AdminOverviewPage() {
  const [events, setEvents] = useState<LiveEvent[]>(() =>
    Array.from({ length: 8 }, makeEvent))
  const [eventsPerMin, setEventsPerMin] = useState(0)
  const countRef = useRef(0)
  const feedRef = useRef<HTMLDivElement>(null)

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ['admin-platform-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data).catch(() => MOCK_STATS),
    staleTime: 30_000,
    placeholderData: MOCK_STATS,
  })

  const s = stats ?? MOCK_STATS

  // Simulate live event stream
  useEffect(() => {
    const interval = setInterval(() => {
      const ev = makeEvent()
      countRef.current++
      setEvents(prev => [ev, ...prev].slice(0, 40))
      if (feedRef.current) feedRef.current.scrollTop = 0
    }, 1800 + Math.random() * 2200)
    return () => clearInterval(interval)
  }, [])

  // Events-per-minute ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setEventsPerMin(countRef.current)
      countRef.current = 0
    }, 60_000)
    return () => clearInterval(tick)
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1
          className="text-[20px] font-bold tracking-tight"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Platform Overview
        </h1>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}>
          Live platform health and key metrics
        </p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Total Users"         value={s.total_users.toLocaleString()} icon={Users}    variant="brand"   delta="+12.4%" />
        <Metric label="Total Clinics"       value={s.total_clinics}               icon={Building2} variant="brand"
          sub={`${s.verified_clinics} verified · ${s.pending_clinics} pending`} />
        <Metric label="Triage Sessions"     value={s.triage_total.toLocaleString()} icon={Activity} variant="success"
          sub={`${s.triage_today.toLocaleString()} today`} delta="+8.1%" />
        <Metric label="Active Sessions Now" value={s.active_sessions}              icon={Wifi}      variant="warning" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Appointments"      value={s.appointments_total.toLocaleString()} icon={Calendar}     variant="brand"
          sub={`${(100 - s.cancellation_rate).toFixed(1)}% completion rate`} />
        <Metric label="Cancellation Rate" value={`${s.cancellation_rate}%`}             icon={AlertTriangle} variant="danger" />
        <Metric label="Total Revenue"     value={formatKES(s.total_revenue_kes)}        icon={DollarSign}    variant="success" delta="+19.3%" />
        <Metric label="Platform MRR"      value={formatKES(s.mrr_kes)}                 icon={TrendingUp}    variant="brand"   delta="+6.2%" />
      </div>

      {/* Chart + live feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Weekly trend */}
        <div className="lg:col-span-3 card p-5">
          <p
            className="text-[13.5px] font-semibold mb-4"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
          >
            Weekly Activity
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={WEEKLY_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1D4ED8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gTriage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#059669" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#D1D5DB' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12, fontFamily: 'Inter, sans-serif' }} />
              <Area type="monotone" dataKey="users"  stroke="#1D4ED8" strokeWidth={2} fill="url(#gUsers)"  name="Users"/>
              <Area type="monotone" dataKey="triage" stroke="#059669" strokeWidth={2} fill="url(#gTriage)" name="Triage"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Live event feed */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-success)' }} />
              <p
                className="text-[13.5px] font-semibold"
                style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
              >
                Live Events
              </p>
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
            >
              {eventsPerMin > 0 ? `${eventsPerMin} /min` : 'streaming…'}
            </span>
          </div>

          <div ref={feedRef} className="flex-1 overflow-y-auto max-h-[320px]" style={{ divideColor: 'var(--color-border)' }}>
            {events.map(ev => {
              const { bg, text, dot } = RISK_STYLE[ev.risk]
              const Icon = EVENT_ICON[ev.type] ?? Activity
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: bg }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: text }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] font-semibold truncate"
                      style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
                    >
                      {ev.description}
                    </p>
                    <p
                      className="text-[10px] truncate"
                      style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                    >
                      {ev.actor}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[9px]"
                      style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}
                    >
                      {new Date(ev.ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Clinic status overview */}
      <div className="card p-5">
        <p
          className="text-[13.5px] font-semibold mb-4"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)' }}
        >
          Clinic Status Breakdown
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Verified',  count: s.verified_clinics,  color: 'var(--color-success)', bg: 'var(--color-success-light)' },
            { label: 'Pending',   count: s.pending_clinics,   color: 'var(--color-warning)', bg: 'var(--color-warning-light)' },
            { label: 'Suspended', count: s.suspended_clinics, color: 'var(--color-danger)',  bg: 'var(--color-danger-light)' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl p-4" style={{ backgroundColor: bg }}>
              <Stethoscope className="h-5 w-5 shrink-0" style={{ color }} />
              <div>
                <p
                  className="text-[20px] font-bold tabular-nums"
                  style={{ color, fontFamily: 'var(--font-display)' }}
                >
                  {count}
                </p>
                <p className="text-[11px] font-semibold" style={{ color, fontFamily: 'var(--font-body)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
