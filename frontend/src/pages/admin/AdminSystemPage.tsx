import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Cpu, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Wifi, Mail, MessageSquare, Database,
} from 'lucide-react'
import { api } from '../../lib/api'

// ── Mock data ─────────────────────────────────────────────────────────────────

function makeHourlyData() {
  const now = new Date()
  return Array.from({ length: 24 }, (_, i) => {
    const h = new Date(now.getTime() - (23 - i) * 3_600_000)
    const base = 95 + Math.sin(i / 3) * 30
    return {
      time: h.getHours().toString().padStart(2, '0') + ':00',
      p50:  Math.round(base + Math.random() * 20),
      p95:  Math.round(base * 2.1 + Math.random() * 60),
      p99:  Math.round(base * 3.8 + Math.random() * 120),
      errors: Math.round(Math.random() * (i === 14 ? 18 : 3)),
    }
  })
}

const HOURLY = makeHourlyData()

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency_ms: number | null
  uptime: string
  details: string
}

const SERVICES: ServiceStatus[] = [
  { name: 'FastAPI (Primary)',    status: 'healthy',  latency_ms: 42,   uptime: '99.98%', details: '4 instances · avg CPU 18%' },
  { name: 'PostgreSQL',          status: 'healthy',  latency_ms: 8,    uptime: '99.99%', details: 'v16.2 · 12.4 GB used · 247 connections' },
  { name: 'Redis (Pub/Sub)',     status: 'healthy',  latency_ms: 1,    uptime: '99.97%', details: '6.2 MB mem · 314 connected clients' },
  { name: 'Celery Workers',      status: 'healthy',  latency_ms: null, uptime: '99.91%', details: '4 workers · 0 failed · 12 pending' },
  { name: 'Africa\'s Talking',   status: 'healthy',  latency_ms: 380,  uptime: '99.40%', details: 'SMS: 97.8% delivery · 3 retrying' },
  { name: 'SendGrid',            status: 'healthy',  latency_ms: 220,  uptime: '99.82%', details: 'Email: 99.1% delivered · 0 bounces' },
  { name: 'WebSocket Gateway',   status: 'healthy',  latency_ms: 12,   uptime: '99.89%', details: '314 active connections · 3 channels' },
  { name: 'Nginx / TLS',         status: 'healthy',  latency_ms: 2,    uptime: '100%',   details: 'TLS 1.3 · cert expires 2026-03-14' },
]

interface QueueJob {
  name: string; pending: number; failed: number; succeeded_24h: number
}

const QUEUE_JOBS: QueueJob[] = [
  { name: 'send_sms_task',            pending: 3,  failed: 0, succeeded_24h: 1_240 },
  { name: 'send_email_task',          pending: 1,  failed: 0, succeeded_24h: 487   },
  { name: 'appointment_reminders',    pending: 0,  failed: 0, succeeded_24h: 344   },
  { name: 'weekly_clinic_reports',    pending: 0,  failed: 0, succeeded_24h: 89    },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_ICON = {
  healthy:  <CheckCircle2 className="h-4 w-4 text-green-500" />,
  degraded: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  down:     <XCircle className="h-4 w-4 text-red-500" />,
}

const STATUS_BADGE = {
  healthy:  { bg: '#D1FAE5', color: '#065F46', label: 'Healthy' },
  degraded: { bg: '#FEF3C7', color: '#92400E', label: 'Degraded' },
  down:     { bg: '#FEE2E2', color: '#991B1B', label: 'Down' },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminSystemPage() {
  const { data: metrics, refetch, isFetching } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => api.get('/admin/system/health').then(r => r.data).catch(() => null),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const allHealthy = SERVICES.every(s => s.status === 'healthy')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">System Health</h1>
          <p className="text-sm text-gray-400 mt-0.5">Real-time infrastructure and service monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
            style={{ backgroundColor: allHealthy ? '#D1FAE5' : '#FEF3C7', color: allHealthy ? '#065F46' : '#92400E' }}>
            <span className={`h-2 w-2 rounded-full ${allHealthy ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            {allHealthy ? 'All systems operational' : 'Degraded service'}
          </div>
          <button onClick={() => refetch()} disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SERVICES.map(s => {
          const sb = STATUS_BADGE[s.status]
          const Icon =
            s.name.includes('Celery') ? RefreshCw :
            s.name.includes('WebSocket') ? Wifi :
            s.name.includes('Talking') ? MessageSquare :
            s.name.includes('SendGrid') ? Mail :
            s.name.includes('Redis') ? Database :
            Cpu
          return (
            <div key={s.name} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                style={{ backgroundColor: `${sb.color === '#065F46' ? '#10B981' : '#F59E0B'}18` }}>
                {STATUS_ICON[s.status]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-800 truncate">{s.name}</p>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: sb.bg, color: sb.color }}>
                    {sb.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.details}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] text-gray-400">Uptime <span className="font-semibold text-gray-600">{s.uptime}</span></span>
                  {s.latency_ms !== null && (
                    <span className="text-[11px] text-gray-400">Latency <span className="font-mono font-semibold text-gray-600">{s.latency_ms}ms</span></span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* API latency chart */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-sm font-bold text-gray-800 mb-4">API Response Times — Last 24h (ms)</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={HOURLY} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={3}/>
            <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => [`${v}ms`]} />
            <Line type="monotone" dataKey="p50" stroke="#10B981" strokeWidth={2} dot={false} name="p50"/>
            <Line type="monotone" dataKey="p95" stroke="#F59E0B" strokeWidth={2} dot={false} name="p95"/>
            <Line type="monotone" dataKey="p99" stroke="#EF4444" strokeWidth={2} dot={false} name="p99"/>
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          {[['p50', '#10B981', 'Median'], ['p95', '#F59E0B', '95th %ile'], ['p99', '#EF4444', '99th %ile']].map(([key, color, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color as string }} />
              <span className="text-[11px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error rate */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-sm font-bold text-gray-800 mb-4">Error Rate — Last 24h</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={HOURLY} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval={3}/>
            <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
            <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} dot={false} name="Errors/hr"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Celery queue */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-sm font-bold text-gray-800">Celery Task Queue</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
              {['Task', 'Pending', 'Failed', 'Succeeded (24h)'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {QUEUE_JOBS.map(j => (
              <tr key={j.name} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-700">{j.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold" style={{ color: j.pending > 0 ? '#D97706' : '#6B7280' }}>
                    {j.pending}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-bold" style={{ color: j.failed > 0 ? '#DC2626' : '#059669' }}>
                    {j.failed}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{j.succeeded_24h.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
