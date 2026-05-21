import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle, Phone, Stethoscope, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { TriageResult, TriageSeverity } from '../../types/triage'

/* ── per-severity config ─────────────────────────────────────── */
const CFG: Record<TriageSeverity, {
  label: string
  subLabel: string
  headerBg: string
  headerText: string
  barColor: string
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}> = {
  mild: {
    label: 'Mild',
    subLabel: 'No immediate concern detected',
    headerBg: '#f0fdf4',
    headerText: '#15803d',
    barColor: '#22c55e',
    Icon: CheckCircle,
  },
  moderate: {
    label: 'Moderate',
    subLabel: 'Should be reviewed by a doctor',
    headerBg: '#fffbeb',
    headerText: '#b45309',
    barColor: '#f59e0b',
    Icon: AlertTriangle,
  },
  urgent: {
    label: 'Urgent',
    subLabel: 'Seek medical attention now',
    headerBg: '#fef2f2',
    headerText: '#b91c1c',
    barColor: '#ef4444',
    Icon: TriangleAlert,
  },
}

/* ── confidence bar ──────────────────────────────────────────── */
function ConfidenceBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), 120)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="mt-3">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: 'rgba(0,0,0,0.35)' }}>
          Confidence
        </span>
        <span className="text-xs font-bold" style={{ color: 'rgba(0,0,0,0.4)' }}>
          {Math.round(value * 100)}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-[1200ms] ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

/* ── component ───────────────────────────────────────────────── */
interface Props {
  result: TriageResult
  onRestart: () => void
}

export function TriageResults({ result, onRestart }: Props) {
  const cfg = CFG[result.severity]
  const SeverityIcon = cfg.Icon
  const recs = result.recommendations

  const escalateLines = Array.isArray(recs.when_to_escalate)
    ? recs.when_to_escalate
    : [recs.when_to_escalate]

  return (
    <div className="space-y-3 animate-slide-up">

      {/* ── Severity header ─────────────────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: cfg.headerBg, border: `1.5px solid ${cfg.barColor}33` }}
      >
        <div className="flex items-center gap-3">
          <SeverityIcon className="h-6 w-6 shrink-0" style={{ color: cfg.headerText }} />
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: `${cfg.headerText}99` }}>
              Assessment
            </p>
            <p className="text-2xl font-black leading-tight" style={{ color: cfg.headerText }}>
              {cfg.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: `${cfg.headerText}99` }}>
              {cfg.subLabel}
            </p>
          </div>
        </div>
        <ConfidenceBar value={result.confidence} color={cfg.barColor} />

        {/* Matched conditions */}
        {result.matched_conditions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.matched_conditions.map(c => (
              <span
                key={c}
                className="text-[11px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ backgroundColor: `${cfg.barColor}22`, color: cfg.headerText }}
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Emergency call banner ───────────────────────────── */}
      {recs.emergency && (
        <div
          className="flex items-center gap-3 rounded-2xl p-4 animate-slide-up animate-stagger-1"
          style={{ backgroundColor: '#b91c1c' }}
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
            <Phone className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Call emergency services now</p>
            <p className="text-red-200 text-xs mt-0.5">Kenya Emergency: 0800 723 253 (toll-free)</p>
          </div>
          <a
            href="tel:0800723253"
            className="shrink-0 bg-white text-red-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Call
          </a>
        </div>
      )}

      {/* ── What to do now ──────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 animate-slide-up animate-stagger-2"
        style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          What to do now
        </p>
        <p className="text-sm text-[#1a1a18] leading-relaxed">{recs.immediate_action}</p>
      </div>

      {/* ── Home care ───────────────────────────────────────── */}
      {recs.home_care.length > 0 && (
        <div
          className="rounded-2xl p-4 animate-slide-up animate-stagger-3"
          style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
            Home care
          </p>
          <div className="space-y-2.5">
            {recs.home_care.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-black text-white mt-px"
                  style={{ backgroundColor: '#15803d' }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── When to escalate ────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 animate-slide-up animate-stagger-4"
        style={{
          backgroundColor: 'white',
          borderLeft: '3px solid #f59e0b',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 mb-2">
          Seek urgent care if…
        </p>
        <div className="space-y-1.5">
          {escalateLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="text-amber-500 mt-[3px] shrink-0">›</span>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* ── Specialists ─────────────────────────────────────── */}
      {result.suggested_specializations.length > 0 && (
        <div
          className="rounded-2xl p-4 animate-slide-up animate-stagger-5"
          style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="h-4 w-4 text-stone-400" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
              Recommended specialist
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.suggested_specializations.map(s => (
              <span
                key={s}
                className="rounded-full px-3 py-1 text-sm font-semibold"
                style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Book CTA ────────────────────────────────────────── */}
      {(recs.should_book_appointment || result.severity !== 'mild') && (
        <Link
          to="/appointments/new"
          className="pulse-btn flex items-center justify-center gap-2 w-full text-white font-bold py-4 rounded-2xl text-sm transition-colors hover:opacity-90"
          style={{ backgroundColor: '#15803d' }}
        >
          Book an appointment
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {/* ── Restart ─────────────────────────────────────────── */}
      <button
        onClick={onRestart}
        className="w-full text-stone-500 font-medium py-3 rounded-2xl text-sm transition-colors hover:bg-stone-100"
        style={{ border: '1.5px solid #e5e2dc' }}
      >
        Check different symptoms
      </button>

      {/* ── Disclaimer ──────────────────────────────────────── */}
      <p className="text-[11px] text-stone-400 text-center leading-relaxed px-4">
        {result.disclaimer}
      </p>
    </div>
  )
}
