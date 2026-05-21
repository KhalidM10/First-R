import { Activity, ArrowUpRight, Calendar, Pill } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const quickActions = [
  {
    label: 'Check Symptoms',
    description: 'Describe what you feel — get a triage in under 2 minutes.',
    icon: Activity,
    href: '/triage',
    accent: '#15803d',
    bg: '#f0fdf4',
  },
  {
    label: 'Book Appointment',
    description: 'Find a verified clinic near you and lock in a slot.',
    icon: Calendar,
    href: '/appointments/new',
    accent: '#1d4ed8',
    bg: '#eff6ff',
  },
  {
    label: 'Order Medicine',
    description: 'Pharmacy network. Genuine drugs, M-Pesa checkout.',
    icon: Pill,
    href: '/medicines',
    accent: '#7c3aed',
    bg: '#f5f3ff',
  },
]

const stats = [
  { value: '1',  label: 'Upcoming',       sub: 'appointments' },
  { value: '0',  label: 'This month',     sub: 'triage sessions' },
  { value: '0',  label: 'Active',         sub: 'prescriptions' },
]

export function DashboardPage() {
  const { user } = useAuthStore()
  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Greeting ─────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-stone-400 mb-1">{getGreeting()}</p>
        <h1
          className="text-3xl font-extrabold text-[#1a1a18] tracking-tight leading-none"
        >
          {firstName}
        </h1>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">
          How are you feeling today? Your health companion is ready.
        </p>
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-[28px] font-black text-[#1a1a18] leading-none">{s.value}</p>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mt-2">{s.label}</p>
            <p className="text-[11px] text-stone-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
          Quick actions
        </p>
        <div className="flex flex-col gap-2.5">
          {quickActions.map(({ label, description, icon: Icon, href, accent, bg }, i) => (
            <Link
              key={href}
              to={href}
              className="group flex items-center gap-4 bg-white rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 animate-slide-up"
              style={{
                animationDelay: `${0.21 + i * 0.07}s`,
                opacity: 0,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-5 w-5" style={{ color: accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1a1a18]">{label}</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">{description}</p>
              </div>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-stone-300 group-hover:text-stone-500 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Triage disclaimer ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 animate-slide-up"
        style={{
          animationDelay: '0.42s',
          opacity: 0,
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900">Guidance only, not diagnosis</p>
            <p className="text-xs text-green-700 mt-0.5 leading-relaxed">
              MedAssist AI gives triage guidance — always confirm with a licensed clinician.
              For emergencies call <span className="font-bold">0800 723 253</span>.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
