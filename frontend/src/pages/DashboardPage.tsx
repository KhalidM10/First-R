import { useQuery } from '@tanstack/react-query'
import { differenceInDays, differenceInHours, format, isAfter, parseISO, startOfDay } from 'date-fns'
import {
  Activity, ArrowUpRight, Bell, Calendar, CheckCircle2,
  ChevronRight, Clock, MapPin, Package, Pill, Stethoscope,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'
import type { Appointment, MedOrder } from '../types'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function countdown(dateStr: string, timeStr: string): string {
  try {
    const dt = parseISO(`${dateStr}T${timeStr}`)
    const hrs = differenceInHours(dt, new Date())
    if (hrs < 0) return 'Past'
    if (hrs < 24) return `In ${hrs}h`
    const days = differenceInDays(dt, startOfDay(new Date()))
    return `In ${days} day${days !== 1 ? 's' : ''}`
  } catch {
    return ''
  }
}

const ORDER_STEPS = ['Pending', 'Processing', 'Ready', 'Delivered']
const ORDER_STEP_IDX: Record<string, number> = {
  pending: 0, processing: 1, ready: 2, delivered: 3,
}

function OrderProgress({ status }: { status: string }) {
  const idx = ORDER_STEP_IDX[status] ?? 0
  const pct = ((idx) / (ORDER_STEPS.length - 1)) * 100
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-semibold text-gray-400">
        {ORDER_STEPS.map((s, i) => (
          <span key={s} style={{ color: i <= idx ? '#1E40AF' : undefined }}>{s}</span>
        ))}
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1E40AF, #3B82F6)' }}
        />
      </div>
    </div>
  )
}

function UpcomingAppointmentCard({ appt }: { appt: Appointment }) {
  const countdownStr = countdown(appt.appointment_date, appt.appointment_time)
  const dateStr = format(parseISO(appt.appointment_date), 'EEE, d MMM yyyy')
  const timeStr = appt.appointment_time?.substring(0, 5) ?? '—'

  return (
    <div
      className="bg-white rounded-2xl p-5 border border-blue-100"
      style={{ boxShadow: '0 1px 3px rgba(30,64,175,0.08), 0 4px 16px rgba(30,64,175,0.06)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Next Appointment</p>
          <h3 className="text-sm font-bold text-gray-900">
            {appt.doctor_name ?? 'Doctor TBD'}
          </h3>
          {appt.clinic_name && (
            <p className="text-xs text-gray-500 mt-0.5">{appt.clinic_name}</p>
          )}
        </div>
        {countdownStr && (
          <span
            className="shrink-0 text-xs font-bold rounded-full px-2.5 py-1"
            style={{ backgroundColor: '#EFF6FF', color: '#1E40AF' }}
          >
            {countdownStr}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Calendar className="h-3.5 w-3.5 text-blue-400" />
          {dateStr}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Clock className="h-3.5 w-3.5 text-blue-400" />
          {timeStr}
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(appt.clinic_name ?? '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <MapPin className="h-3.5 w-3.5" /> Get Directions
        </a>
        <Link
          to="/appointments"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: '#1E40AF' }}
        >
          <Calendar className="h-3.5 w-3.5" /> View Details
        </Link>
      </div>
    </div>
  )
}

function ActiveOrderCard({ order }: { order: MedOrder }) {
  const items = (order as any).items ?? []
  const itemCount = Array.isArray(items) ? items.length : 0
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-purple-100"
      style={{ boxShadow: '0 1px 3px rgba(124,58,237,0.08), 0 4px 16px rgba(124,58,237,0.06)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Active Order</p>
          <p className="text-sm font-bold text-gray-900">
            {(order as any).order_number ?? (order as any).order_reference ?? 'Order'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F5F3FF' }}>
          <Package className="h-4.5 w-4.5 text-purple-600" />
        </div>
      </div>
      <OrderProgress status={(order as any).status ?? 'pending'} />
      <div className="mt-3 flex justify-end">
        <Link
          to="/medicines"
          className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
        >
          View order <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

const quickActions = [
  {
    label: 'Check Symptoms',
    description: 'Describe what you feel — get triage in 60 seconds.',
    icon: Activity,
    href: '/triage',
    accent: '#15803d',
    bg: '#f0fdf4',
  },
  {
    label: 'Book Appointment',
    description: 'Find a verified clinic and lock in your slot.',
    icon: Calendar,
    href: '/clinics',
    accent: '#1E40AF',
    bg: '#eff6ff',
  },
  {
    label: 'Order Medicine',
    description: 'Genuine OTC drugs, M-Pesa checkout.',
    icon: Pill,
    href: '/medicines',
    accent: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    label: 'My Records',
    description: 'Health profile, allergies, history.',
    icon: Stethoscope,
    href: '/profile',
    accent: '#0369a1',
    bg: '#f0f9ff',
  },
]

export function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['my-appointments', 'upcoming'],
    queryFn: async () => {
      const { data } = await api.get('/appointments/my', { params: { filter: 'upcoming' } })
      return data
    },
    staleTime: 60_000,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my')
      return data
    },
    staleTime: 60_000,
  })

  const nextAppt = appointments[0] ?? null
  const activeOrders = Array.isArray(orders)
    ? orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status))
    : []
  const activeOrder = activeOrders[0] ?? null

  const stats = [
    { value: appointments.length.toString(), label: 'Upcoming', sub: 'appointments' },
    { value: activeOrders.length.toString(), label: 'Active', sub: 'orders' },
    { value: '—', label: 'This month', sub: 'triage sessions' },
  ]

  return (
    <div className="space-y-7 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-400">{getGreeting()}</p>
          <h1 className="text-3xl font-extrabold text-[#1a1a18] tracking-tight leading-none mt-1">
            {firstName} 👋
          </h1>
          <p className="text-sm text-stone-500 mt-1.5 leading-relaxed">
            Your health companion is ready.
          </p>
        </div>
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <Bell className="h-4.5 w-4.5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-white" />
        </button>
      </div>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 animate-slide-up"
            style={{
              animationDelay: `${i * 0.07}s`,
              opacity: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <p className="text-[28px] font-black text-[#1a1a18] leading-none">{s.value}</p>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mt-2">{s.label}</p>
            <p className="text-[11px] text-stone-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Upcoming appointment ─────────────────────────────── */}
      {nextAppt && (
        <div className="animate-slide-up" style={{ animationDelay: '0.18s', opacity: 0 }}>
          <UpcomingAppointmentCard appt={nextAppt} />
        </div>
      )}

      {/* ── Active order ─────────────────────────────────────── */}
      {activeOrder && (
        <div className="animate-slide-up" style={{ animationDelay: '0.24s', opacity: 0 }}>
          <ActiveOrderCard order={activeOrder} />
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map(({ label, description, icon: Icon, href, accent, bg }, i) => (
            <Link
              key={href}
              to={href}
              className="group flex flex-col gap-3 bg-white rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 animate-slide-up"
              style={{
                animationDelay: `${0.28 + i * 0.06}s`,
                opacity: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500 transition-colors mt-0.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a1a18]">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── No upcoming appointments empty promo ─────────────── */}
      {!nextAppt && appointments.length === 0 && (
        <div
          className="rounded-2xl p-5 flex items-start gap-4 animate-slide-up"
          style={{ animationDelay: '0.5s', opacity: 0, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' }}
        >
          <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-blue-900">No upcoming appointments</p>
            <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
              Find a verified clinic near you and book in minutes.
            </p>
            <Link
              to="/clinics"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#1E40AF' }}
            >
              Find a clinic <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── AI triage disclaimer ─────────────────────────────── */}
      <div
        className="rounded-2xl p-4 animate-slide-up"
        style={{
          animationDelay: '0.55s',
          opacity: 0,
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Guidance only, not a diagnosis</p>
            <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
              MedAssist AI gives triage guidance. For emergencies call{' '}
              <a href="tel:0800723253" className="font-bold underline">0800 723 253</a>.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
