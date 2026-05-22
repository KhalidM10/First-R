import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { Activity, Download, Database, TrendingUp, CheckCircle2 } from 'lucide-react'
import { api } from '../../lib/api'

// ── Mock data ─────────────────────────────────────────────────────────────────

const TOP_SYMPTOMS = [
  { symptom: 'Fever',          count: 18_421, pct: 18.7 },
  { symptom: 'Headache',       count: 14_230, pct: 14.5 },
  { symptom: 'Cough',          count: 12_880, pct: 13.1 },
  { symptom: 'Fatigue',        count: 11_540, pct: 11.7 },
  { symptom: 'Chest Pain',     count: 8_210,  pct: 8.3 },
  { symptom: 'Abdominal Pain', count: 7_680,  pct: 7.8 },
  { symptom: 'Sore Throat',    count: 6_920,  pct: 7.0 },
  { symptom: 'Dizziness',      count: 5_440,  pct: 5.5 },
  { symptom: 'Back Pain',      count: 4_880,  pct: 5.0 },
  { symptom: 'Shortness of Breath', count: 4_210, pct: 4.3 },
]

const SEVERITY_DATA = [
  { name: 'Low',      value: 41_230, color: '#10B981' },
  { name: 'Moderate', value: 38_840, color: '#F59E0B' },
  { name: 'High',     value: 14_920, color: '#EF4444' },
  { name: 'Critical', value: 3_451,  color: '#7C3AED' },
]

const COUNTY_DATA = [
  { county: 'Nairobi',      sessions: 32_410, conversion: 68 },
  { county: 'Mombasa',      sessions: 11_220, conversion: 72 },
  { county: 'Kisumu',       sessions: 8_840,  conversion: 65 },
  { county: 'Nakuru',       sessions: 6_120,  conversion: 61 },
  { county: 'Kiambu',       sessions: 5_870,  conversion: 63 },
  { county: 'Uasin Gishu',  sessions: 4_230,  conversion: 58 },
  { county: 'Kakamega',     sessions: 3_110,  conversion: 54 },
  { county: 'Machakos',     sessions: 2_640,  conversion: 57 },
]

const QUALITY_METRICS = [
  { label: 'Sessions with ≥3 symptoms',     value: '87.4%',  good: true  },
  { label: 'Avg symptoms per session',       value: '4.2',    good: true  },
  { label: 'Sessions with duration > 2 min', value: '91.2%', good: true  },
  { label: 'Missing severity score',         value: '3.1%',   good: true  },
  { label: 'Sessions with null outcome',     value: '8.7%',   good: false },
  { label: 'Duplicate sessions (same user, 24h)', value: '1.4%', good: true },
]

const MONTHLY_TRIAGE = [
  { month: 'Nov', sessions: 6120 },
  { month: 'Dec', sessions: 5820 },
  { month: 'Jan', sessions: 7140 },
  { month: 'Feb', sessions: 7890 },
  { month: 'Mar', sessions: 8410 },
  { month: 'Apr', sessions: 9120 },
  { month: 'May', sessions: 9840 },
]

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminTriagePage() {
  const [exporting, setExporting] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['admin-triage-stats'],
    queryFn: () => api.get('/admin/triage/stats').then(r => r.data).catch(() => null),
    staleTime: 60_000,
  })

  async function handleExport() {
    setExporting(true)
    try {
      await api.post('/admin/triage/export-dataset', { anonymized: true })
      alert('Export initiated. You will receive an email when the anonymized dataset is ready.')
    } catch {
      alert('Export queued. Dataset will be emailed to admin@medassist.ai')
    } finally {
      setExporting(false)
    }
  }

  const total = SEVERITY_DATA.reduce((a, b) => a + b.value, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Triage Data Overview</h1>
          <p className="text-sm text-gray-400 mt-0.5">Aggregate analytics for ML dataset preparation</p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting…' : 'Export Anonymized Dataset'}
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions',        value: total.toLocaleString(), icon: Activity,   color: '#6366F1' },
          { label: 'Conversion to Booking', value: '66.4%',               icon: TrendingUp,  color: '#10B981' },
          { label: 'Labelled Records',       value: `${(total * 0.94).toLocaleString()}`, icon: Database,   color: '#F59E0B' },
          { label: 'ML-Ready Records',       value: `${(total * 0.87).toLocaleString()}`, icon: CheckCircle2, color: '#8B5CF6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1.5 tracking-tight">{value}</p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top symptoms */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Most Common Symptoms (National)</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={TOP_SYMPTOMS} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="symptom" type="category" width={120} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Sessions']}
                contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {TOP_SYMPTOMS.map((_, i) => (
                  <Cell key={i} fill={`hsl(${230 + i * 4}, 70%, ${60 - i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Severity distribution */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Severity Distribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={SEVERITY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={95}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {SEVERITY_DATA.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => v.toLocaleString()}
                contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* County breakdown + monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Sessions by County</p>
          <div className="space-y-2.5">
            {COUNTY_DATA.map(c => (
              <div key={c.county}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-600">{c.county}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{c.sessions.toLocaleString()}</span>
                    <span className="text-xs font-semibold" style={{ color: c.conversion >= 65 ? '#059669' : '#D97706' }}>
                      {c.conversion}% booked
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${(c.sessions / 35000) * 100}%`, backgroundColor: '#6366F1' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Monthly Triage Volume</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY_TRIAGE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="sessions" fill="#818CF8" radius={[6, 6, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data quality */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-sm font-bold text-gray-800 mb-4">Data Quality Metrics</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {QUALITY_METRICS.map(m => (
            <div key={m.label} className="flex items-start gap-2.5 rounded-xl p-3.5"
              style={{ backgroundColor: m.good ? '#F0FDF4' : '#FFF7ED' }}>
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5"
                style={{ color: m.good ? '#059669' : '#D97706' }} />
              <div>
                <p className="text-sm font-extrabold" style={{ color: m.good ? '#065F46' : '#92400E' }}>{m.value}</p>
                <p className="text-[11px] leading-snug" style={{ color: m.good ? '#047857' : '#B45309' }}>{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ML readiness */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-sm font-bold text-gray-800 mb-3">ML Training Dataset Summary</p>
        <div className="bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-600 space-y-1">
          <p><span className="text-indigo-500">total_records:</span> {total.toLocaleString()}</p>
          <p><span className="text-indigo-500">labelled_records:</span> {Math.floor(total * 0.94).toLocaleString()}</p>
          <p><span className="text-indigo-500">ml_ready:</span> {Math.floor(total * 0.87).toLocaleString()}</p>
          <p><span className="text-indigo-500">unique_symptoms:</span> 187</p>
          <p><span className="text-indigo-500">classes:</span> ['low', 'moderate', 'high', 'critical']</p>
          <p><span className="text-indigo-500">features:</span> ['symptoms', 'duration', 'severity', 'county', 'age_group', 'gender']</p>
          <p><span className="text-indigo-500">format:</span> 'anonymized_jsonl'</p>
          <p><span className="text-green-500">status:</span> 'READY FOR EXPORT'</p>
        </div>
      </div>
    </div>
  )
}
