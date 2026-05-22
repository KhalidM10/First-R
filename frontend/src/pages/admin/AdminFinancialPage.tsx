import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { formatKES } from '../../lib/utils'

// ── Mock data ─────────────────────────────────────────────────────────────────

const MONTHLY_REVENUE = [
  { month: 'Nov 24', revenue: 620_000, basic: 80_000,  pro: 340_000, enterprise: 200_000 },
  { month: 'Dec 24', revenue: 710_000, basic: 80_000,  pro: 380_000, enterprise: 250_000 },
  { month: 'Jan 25', revenue: 780_000, basic: 80_000,  pro: 420_000, enterprise: 280_000 },
  { month: 'Feb 25', revenue: 860_000, basic: 80_000,  pro: 440_000, enterprise: 340_000 },
  { month: 'Mar 25', revenue: 980_000, basic: 80_000,  pro: 510_000, enterprise: 390_000 },
  { month: 'Apr 25', revenue: 1_120_000, basic: 80_000, pro: 580_000, enterprise: 460_000 },
  { month: 'May 25', revenue: 1_248_000, basic: 80_000, pro: 640_000, enterprise: 528_000 },
]

const PLAN_BREAKDOWN = [
  { plan: 'Enterprise', count: 22,  mrr: 329_978, color: '#7C3AED' },
  { plan: 'Pro',        count: 128, mrr: 639_872, color: '#1E40AF' },
  { plan: 'Basic',      count: 84,  mrr: 0,       color: '#64748B' },
]

const CLINIC_LTV = [
  { name: 'Mombasa Coastal Specialists', plan: 'enterprise', ltv: 1_240_000, months: 14, mrr: 14_999, churn_risk: 'low' },
  { name: 'Nairobi West Medical Centre', plan: 'pro',        ltv: 449_910,   months: 9,  mrr: 4_999,  churn_risk: 'low' },
  { name: 'Kisumu Lake Health Centre',   plan: 'enterprise', ltv: 419_972,   months: 28, mrr: 14_999, churn_risk: 'medium' },
  { name: 'Eldoret Highland Clinic',     plan: 'pro',        ltv: 224_955,   months: 45, mrr: 4_999,  churn_risk: 'high' },
  { name: 'City Eye Clinic Nairobi',     plan: 'pro',        ltv: 179_964,   months: 36, mrr: 4_999,  churn_risk: 'medium' },
]

const CHURN_DATA = [
  { month: 'Nov', churned: 2, new: 14 },
  { month: 'Dec', churned: 1, new: 17 },
  { month: 'Jan', churned: 3, new: 21 },
  { month: 'Feb', churned: 2, new: 19 },
  { month: 'Mar', churned: 1, new: 24 },
  { month: 'Apr', churned: 4, new: 22 },
  { month: 'May', churned: 2, new: 18 },
]

const FORECAST = [
  { month: 'Jun 25', low: 1_280_000, mid: 1_340_000, high: 1_420_000 },
  { month: 'Jul 25', low: 1_320_000, mid: 1_420_000, high: 1_560_000 },
  { month: 'Aug 25', low: 1_360_000, mid: 1_510_000, high: 1_700_000 },
]

const PLAN_STYLE: Record<string, { bg: string; color: string }> = {
  enterprise: { bg: '#F5F3FF', color: '#6D28D9' },
  pro:        { bg: '#EFF6FF', color: '#1E40AF' },
  basic:      { bg: '#F1F5F9', color: '#64748B' },
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminFinancialPage() {
  const currentMRR = 1_248_000
  const prevMRR    = 1_120_000
  const mrrGrowth  = ((currentMRR - prevMRR) / prevMRR * 100).toFixed(1)
  const avgLTV     = Math.round(CLINIC_LTV.reduce((a, b) => a + b.ltv, 0) / CLINIC_LTV.length)
  const churnRate  = '3.2%'

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Financial Overview</h1>
        <p className="text-sm text-gray-400 mt-0.5">Subscription revenue, MRR, and churn analytics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Current MRR',   value: formatKES(currentMRR),  icon: DollarSign,   color: '#6366F1', delta: `+${mrrGrowth}%` },
          { label: 'Annual Run Rate', value: formatKES(currentMRR * 12), icon: TrendingUp, color: '#10B981', delta: 'projected' },
          { label: 'Avg Clinic LTV', value: formatKES(avgLTV),    icon: Users,          color: '#8B5CF6' },
          { label: 'Monthly Churn',  value: churnRate,             icon: TrendingDown,   color: '#EF4444' },
        ].map(({ label, value, icon: Icon, color, delta }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1.5 tracking-tight">{value}</p>
                {delta && <p className="text-xs font-semibold text-gray-400 mt-0.5">{delta}</p>}
              </div>
              <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${color}18` }}>
                <Icon className="h-4.5 w-4.5" style={{ color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-sm font-bold text-gray-800 mb-4">Monthly Revenue by Plan (KES)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_REVENUE} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false}/>
            <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
            <Bar dataKey="enterprise" stackId="a" fill="#7C3AED" radius={[0,0,0,0]} name="Enterprise"/>
            <Bar dataKey="pro"        stackId="a" fill="#3B82F6" name="Pro"/>
            <Bar dataKey="basic"      stackId="a" fill="#94A3B8" radius={[6,6,0,0]} name="Basic"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* MRR breakdown + churn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">MRR by Plan</p>
          <div className="space-y-3.5">
            {PLAN_BREAKDOWN.map(p => {
              const ps = PLAN_STYLE[p.plan.toLowerCase()] ?? PLAN_STYLE.basic
              const pct = p.mrr > 0 ? (p.mrr / currentMRR) * 100 : 0
              return (
                <div key={p.plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: ps.bg, color: ps.color }}>{p.plan}</span>
                      <span className="text-xs text-gray-400">{p.count} clinics</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">{p.mrr > 0 ? formatKES(p.mrr) : '—'}</p>
                      {p.mrr > 0 && <p className="text-[10px] text-gray-400">{pct.toFixed(1)}% of MRR</p>}
                    </div>
                  </div>
                  {p.mrr > 0 && (
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: p.color }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <p className="text-sm font-bold text-gray-800 mb-4">Churn vs New Clinics</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CHURN_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              <Bar dataKey="new"     fill="#6366F1" radius={[4,4,0,0]} name="New" />
              <Bar dataKey="churned" fill="#EF4444" radius={[4,4,0,0]} name="Churned" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clinic LTV table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-sm font-bold text-gray-800">Top Clinic Lifetime Value</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
              {['Clinic', 'Plan', 'MRR', 'Months', 'LTV', 'Churn Risk'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {CLINIC_LTV.map(c => {
              const ps = PLAN_STYLE[c.plan]
              const cr = c.churn_risk === 'high' ? { bg: '#FEE2E2', color: '#DC2626' }
                       : c.churn_risk === 'medium' ? { bg: '#FEF3C7', color: '#D97706' }
                       : { bg: '#D1FAE5', color: '#059669' }
              return (
                <tr key={c.name} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold capitalize"
                      style={{ backgroundColor: ps.bg, color: ps.color }}>{c.plan}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm text-gray-700">{formatKES(c.mrr)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{c.months}mo</td>
                  <td className="px-5 py-3.5 font-mono text-sm font-bold text-gray-900">{formatKES(c.ltv)}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold capitalize"
                      style={{ backgroundColor: cr.bg, color: cr.color }}>{c.churn_risk}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Revenue forecast */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-800">3-Month Revenue Forecast</p>
          <span className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1">Based on current growth rate</span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={FORECAST} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9"/>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false}/>
            <YAxis tickFormatter={v => `${(v/1000000).toFixed(1)}M`} tick={{ fontSize: 10, fill: '#CBD5E1' }} axisLine={false} tickLine={false}/>
            <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
            <Area type="monotone" dataKey="high" stroke="#6366F1" strokeWidth={0} fill="url(#gForecast)" name="High"/>
            <Area type="monotone" dataKey="mid"  stroke="#6366F1" strokeWidth={2.5} fill="none" name="Expected"/>
            <Area type="monotone" dataKey="low"  stroke="#6366F1" strokeWidth={0} fill="url(#gForecast)" name="Low"/>
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {FORECAST.map(f => (
            <div key={f.month} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-gray-400">{f.month}</p>
              <p className="text-sm font-extrabold text-indigo-600 mt-0.5">{formatKES(f.mid)}</p>
              <p className="text-[10px] text-gray-400">{formatKES(f.low)} – {formatKES(f.high)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
