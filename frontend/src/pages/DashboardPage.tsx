import { useQuery } from '@tanstack/react-query'
import { differenceInDays, differenceInHours, format, parseISO, startOfDay } from 'date-fns'
import {
  Activity, ArrowRight, Calendar, CheckCircle2,
  Clock, MapPin, Package, Pill, Stethoscope,
  TrendingUp, ChevronRight,
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

function countdown(dateStr: string, timeStr: string) {
  try {
    const dt = parseISO(`${dateStr}T${timeStr}`)
    const hrs = differenceInHours(dt, new Date())
    if (hrs < 0) return null
    if (hrs < 24) return { label: `${hrs}h away`, urgent: hrs < 4 }
    const days = differenceInDays(dt, startOfDay(new Date()))
    return { label: `${days} day${days !== 1 ? 's' : ''} away`, urgent: false }
  } catch { return null }
}

const ORDER_STEPS = ['Pending', 'Processing', 'Ready', 'Delivered']
const ORDER_STEP_IDX: Record<string, number> = { pending: 0, processing: 1, ready: 2, delivered: 3 }

function OrderProgress({ status }: { status: string }) {
  const idx = ORDER_STEP_IDX[status] ?? 0
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between">
        {ORDER_STEPS.map((s, i) => (
          <span key={s} className={`text-[11px] font-medium ${i <= idx ? 'text-blue-600' : 'text-slate-400'}`}>{s}</span>
        ))}
      </div>
      <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-700"
          style={{ width: `${(idx / (ORDER_STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/80 ${className}`}>
      {children}
    </div>
  )
}

const QUICK_ACTIONS = [
  {
    label: 'Check Symptoms',
    sub: 'AI triage in 60 seconds',
    icon: Activity,
    href: '/triage',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    label: 'Book Appointment',
    sub: 'Find & book verified clinics',
    icon: Calendar,
    href: '/clinics',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    label: 'Order Medicine',
    sub: 'OTC drugs, M-Pesa checkout',
    icon: Pill,
    href: '/medicines',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    label: 'Health Profile',
    sub: 'Records, allergies, history',
    icon: Stethoscope,
    href: '/profile',
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#BAE6FD',
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
  const cd = nextAppt ? countdown(nextAppt.appointment_date, nextAppt.appointment_time) : null

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="animate-fade-up-1">
        <p
          className="text-[13px] font-medium"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          {getGreeting()}
        </p>
        <h1
          className="text-[26px] font-bold tracking-tight mt-0.5"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          {firstName}
        </h1>
        <p className="text-[13.5px] mt-1" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
          Here's what's happening with your health today.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up-2">
        {[
          { value: appointments.length, label: 'Upcoming appointments', icon: Calendar },
          { value: activeOrders.length, label: 'Active medicine orders', icon: Package },
          { value: '—',                 label: 'Triage sessions',        icon: Activity },
        ].map(({ value, label, icon: Icon }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-brand-light)' }}
              >
                <Icon className="h-4 w-4" style={{ color: 'var(--color-brand)' }} />
              </div>
              <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--color-border-strong)' }} />
            </div>
            <p
              className="text-[22px] font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
            >
              {value}
            </p>
            <p
              className="text-[11.5px] mt-0.5 leading-snug"
              style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
            >
              {label}
            </p>
          </Card>
        ))}
      </div>

      {/* ── Upcoming appointment ── */}
      {nextAppt && (
        <Card className="overflow-hidden animate-fade-up-3">
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFBFF' }}>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-[12px] font-semibold text-blue-600 uppercase tracking-wide">Next Appointment</span>
            </div>
            {cd && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                cd.urgent ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {cd.label}
              </span>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {nextAppt.doctor_name ?? 'Doctor TBD'}
                </h3>
                {nextAppt.clinic_name && (
                  <p className="text-[13px] text-slate-400 mt-0.5">{nextAppt.clinic_name}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold text-slate-700">
                  {format(parseISO(nextAppt.appointment_date), 'EEE, d MMM')}
                </p>
                <p className="text-[12px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" />
                  {nextAppt.appointment_time?.substring(0, 5)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(nextAppt.clinic_name ?? '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" /> Directions
              </a>
              <Link
                to="/appointments"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'var(--color-brand)' }}
              >
                View Details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── Active medicine order ── */}
      {activeOrder && (
        <Card className="overflow-hidden animate-fade-up-4">
          <div className="px-5 py-3 flex items-center gap-2"
            style={{ borderBottom: '1px solid #F1F5F9', background: '#FDFAFF' }}>
            <Package className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[12px] font-semibold text-violet-600 uppercase tracking-wide">Active Order</span>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-semibold text-slate-800">
                {(activeOrder as any).order_number ?? (activeOrder as any).order_reference ?? 'Order'}
              </p>
              <Link to="/medicines" className="text-[12px] font-medium text-violet-600 hover:text-violet-800 flex items-center gap-1 transition-colors">
                Details <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <OrderProgress status={(activeOrder as any).status ?? 'pending'} />
          </div>
        </Card>
      )}

      {/* ── Quick actions ── */}
      <div className="animate-fade-up-5">
        <p
          className="text-[11.5px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {QUICK_ACTIONS.map(({ label, sub, icon: Icon, href, color, bg, border }) => (
            <Link
              key={href}
              to={href}
              className="group flex flex-col gap-3 bg-white rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon className="h-[17px] w-[17px]" style={{ color }} />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-slate-800 leading-none">{label}</p>
                <p className="text-[12px] text-slate-400 mt-1 leading-snug">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Book CTA — shown only when no upcoming appt ── */}
      {!nextAppt && (
        <Card className="p-5 animate-fade-up-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-slate-800">No upcoming appointments</p>
              <p className="text-[13px] text-slate-400 mt-0.5">
                Find a verified clinic near you and book in minutes.
              </p>
              <Link
                to="/clinics"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'var(--color-brand)' }}
              >
                Find a clinic <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 p-4 animate-fade-up-6">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
        <p className="text-[12.5px] text-emerald-700 leading-relaxed">
          <span className="font-semibold">Guidance only — not a diagnosis.</span>{' '}
          MedAssist AI provides triage guidance. For emergencies call{' '}
          <a href="tel:0800723253" className="font-bold underline">0800 723 253</a>.
        </p>
      </div>

    </div>
  )
}
