import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ShieldAlert, Search, Download, AlertTriangle,
  Filter, MapPin, ChevronDown,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditEvent {
  id: string
  timestamp: string
  event_type: string
  actor_email: string
  actor_role: string
  target: string
  clinic_name: string | null
  ip_address: string
  county: string | null
  risk_score: number
  details: string
}

interface LoginGeo {
  lat: number; lng: number; count: number; city: string
}

// ── Mock data ──────────────────────────────────────────────────────────────────

function makeMockEvents(): AuditEvent[] {
  const templates = [
    { event_type: 'user.login',           actor_email: 'akinyi@gmail.com',        actor_role: 'patient',       target: 'session',              clinic_name: null,                   county: 'Nairobi',      risk_score: 5,  details: 'Successful login from Chrome/Android' },
    { event_type: 'user.role_change',     actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'user:brian.mutua',     clinic_name: null,                   county: 'Nairobi',      risk_score: 85, details: 'Role changed patient → clinic_admin' },
    { event_type: 'clinic.verified',      actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'clinic:Kisumu Health',  clinic_name: 'Kisumu Health',        county: 'Kisumu',       risk_score: 10, details: 'Clinic manually verified' },
    { event_type: 'appointment.booked',   actor_email: 'mercy.w@gmail.com',       actor_role: 'patient',       target: 'appointment#MA-88213', clinic_name: 'Nairobi West Medical', county: 'Nairobi',      risk_score: 2,  details: 'Appointment booked with Dr. Omondi' },
    { event_type: 'user.login_failed',    actor_email: 'unknown@domain.com',      actor_role: 'unknown',       target: 'auth',                  clinic_name: null,                   county: null,           risk_score: 72, details: '5 consecutive failed login attempts from 41.90.12.xx' },
    { event_type: 'user.impersonation',   actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'user:fatuma@gmail.com', clinic_name: null,                   county: 'Mombasa',      risk_score: 92, details: 'Admin impersonated user — reason: GDPR data request' },
    { event_type: 'clinic.suspended',     actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'clinic:Nakuru Central', clinic_name: 'Nakuru Central',       county: 'Nakuru',       risk_score: 60, details: 'Clinic suspended: fraudulent billing detected' },
    { event_type: 'order.placed',         actor_email: 'kipchoge.j@work.co.ke',   actor_role: 'patient',       target: 'order#MA-ORD-9921',    clinic_name: 'Mombasa Coastal',      county: 'Mombasa',      risk_score: 3,  details: 'Medicine order KES 2,400 placed' },
    { event_type: 'user.password_reset',  actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'user:akinyi@gmail.com', clinic_name: null,                   county: 'Nairobi',      risk_score: 45, details: 'Admin forced password reset' },
    { event_type: 'triage.session',       actor_email: 'patient#77231',           actor_role: 'patient',       target: 'triage#7721',          clinic_name: null,                   county: 'Kiambu',       risk_score: 1,  details: 'Triage: fever, headache, fatigue — moderate severity' },
    { event_type: 'clinic.plan_changed',  actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'clinic:Thika Wellness', clinic_name: 'Thika Wellness Hub',   county: 'Kiambu',       risk_score: 20, details: 'Plan changed basic → pro' },
    { event_type: 'user.account_locked',  actor_email: 'admin@medassist.ai',      actor_role: 'super_admin',   target: 'user:fatuma@gmail.com', clinic_name: null,                   county: 'Mombasa',      risk_score: 55, details: 'Account locked: suspicious activity' },
  ]

  const now = Date.now()
  return templates.map((t, i) => ({
    ...t,
    id: `evt-${i + 1}`,
    timestamp: new Date(now - i * 14 * 60_000).toISOString(),
    ip_address: `41.${90 + (i % 10)}.${i * 7 % 255}.${i * 13 % 255}`,
  }))
}

const MOCK_EVENTS = makeMockEvents()

const MOCK_GEO: LoginGeo[] = [
  { lat: -1.2921, lng: 36.8219, count: 4210, city: 'Nairobi' },
  { lat: -4.0435, lng: 39.6682, count: 1140, city: 'Mombasa' },
  { lat: -0.1022, lng: 34.7617, count: 890,  city: 'Kisumu' },
  { lat: -0.3031, lng: 36.0800, count: 540,  city: 'Nakuru' },
  { lat:  0.5143, lng: 35.2698, count: 480,  city: 'Eldoret' },
  { lat: -1.0332, lng: 37.0690, count: 320,  city: 'Thika' },
  { lat: -0.4167, lng: 36.9500, count: 210,  city: 'Kiambu' },
  { lat:  0.5500, lng: 34.5667, count: 180,  city: 'Kakamega' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

const RISK_BADGE = (score: number) => {
  if (score >= 70) return { bg: '#FEE2E2', color: '#DC2626', label: 'High' }
  if (score >= 40) return { bg: '#FEF3C7', color: '#D97706', label: 'Med' }
  return { bg: '#D1FAE5', color: '#059669', label: 'Low' }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  'user.login':           'Login',
  'user.login_failed':    'Failed Login',
  'user.role_change':     'Role Change',
  'user.impersonation':   'Impersonation',
  'user.password_reset':  'Password Reset',
  'user.account_locked':  'Account Locked',
  'clinic.verified':      'Clinic Verified',
  'clinic.suspended':     'Clinic Suspended',
  'clinic.plan_changed':  'Plan Change',
  'appointment.booked':   'Appointment',
  'order.placed':         'Order',
  'triage.session':       'Triage',
}

const EVENT_TYPES = ['all', ...Object.keys(EVENT_TYPE_LABELS)] as const

function downloadCSV(events: AuditEvent[]) {
  const header = 'timestamp,event_type,actor_email,actor_role,target,clinic_name,ip_address,county,risk_score,details'
  const rows = events.map(e =>
    [e.timestamp, e.event_type, e.actor_email, e.actor_role, e.target,
      e.clinic_name ?? '', e.ip_address, e.county ?? '', e.risk_score, `"${e.details}"`].join(',')
  )
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `audit_${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function AdminAuditPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [riskOnly, setRiskOnly] = useState(false)

  const { data } = useQuery<AuditEvent[]>({
    queryKey: ['admin-audit'],
    queryFn: () => api.get('/admin/audit').then(r => r.data).catch(() => MOCK_EVENTS),
    staleTime: 15_000,
    refetchInterval: 30_000,
    placeholderData: MOCK_EVENTS,
  })

  const events = data ?? MOCK_EVENTS

  const filtered = useMemo(() =>
    events.filter(e => {
      if (riskOnly && e.risk_score < 70) return false
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false
      if (search && !e.actor_email.includes(search) && !e.details.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }),
  [events, riskOnly, typeFilter, search])

  const highRisk = events.filter(e => e.risk_score >= 70)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Platform Audit Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">All security events across all clinics</p>
        </div>
        <button onClick={() => downloadCSV(filtered)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* High-risk banner */}
      {highRisk.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">{highRisk.length} high-risk events detected</p>
            <div className="mt-2 space-y-1">
              {highRisk.slice(0, 3).map(e => (
                <p key={e.id} className="text-xs text-red-600">
                  <span className="font-mono">[{new Date(e.timestamp).toLocaleTimeString('en-KE')}]</span>
                  {' '}{e.details}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actor or details…"
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none">
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All event types' : EVENT_TYPE_LABELS[t] ?? t}</option>)}
        </select>
        <button onClick={() => setRiskOnly(v => !v)}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all"
          style={riskOnly ? { backgroundColor: '#FEE2E2', color: '#DC2626' } : { backgroundColor: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }}>
          <ShieldAlert className="h-3.5 w-3.5" /> High-risk only
        </button>
      </div>

      {/* Event table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                {['Time', 'Event', 'Actor', 'Target', 'IP', 'County', 'Risk', 'Details'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(e => {
                const rb = RISK_BADGE(e.risk_score)
                return (
                  <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(parseISO(e.timestamp), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono px-2 py-0.5">
                        {e.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-700 font-mono max-w-[160px] truncate">{e.actor_email}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 font-mono max-w-[140px] truncate">{e.target}</td>
                    <td className="px-4 py-3 text-[11px] text-gray-400 font-mono whitespace-nowrap">{e.ip_address}</td>
                    <td className="px-4 py-3 text-[12px] text-gray-500">{e.county ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: rb.bg, color: rb.color }}>
                        {rb.label} {e.risk_score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-gray-500 max-w-[200px] truncate">{e.details}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12">
              <Filter className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400 font-semibold">No events match filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Geographic map */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-bold text-gray-800">Login Origin Map — Kenya</p>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ height: 340 }}>
          <MapContainer
            center={[-0.5, 37.5]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {MOCK_GEO.map(g => (
              <CircleMarker
                key={g.city}
                center={[g.lat, g.lng]}
                radius={Math.sqrt(g.count / 100) + 4}
                pathOptions={{ color: '#6366F1', fillColor: '#818CF8', fillOpacity: 0.5, weight: 1.5 }}
              >
                <Popup>
                  <b>{g.city}</b><br />{g.count.toLocaleString()} logins
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
