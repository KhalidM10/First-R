import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, AlertTriangle, CheckCircle2, Clock, Minus, Plus } from 'lucide-react'
import { api } from '../../lib/api'

const SYMPTOMS = [
  'Fever', 'Headache', 'Cough', 'Sore Throat', 'Chest Pain',
  'Stomach Ache', 'Fatigue', 'Nausea', 'Diarrhoea', 'Back Pain',
  'Joint Pain', 'Skin Rash', 'Shortness of Breath', 'Dizziness',
  'Vomiting', 'Eye Pain', 'Ear Pain', 'Runny Nose', 'Muscle Pain', 'Loss of Appetite',
]

const DURATIONS = [
  { label: '1 day', value: 1 },
  { label: '2–3 days', value: 2 },
  { label: '4–7 days', value: 5 },
  { label: '1–2 weeks', value: 10 },
  { label: '2–4 weeks', value: 21 },
]

const SEVERITY_CONFIG = {
  mild:      { color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Mild', icon: CheckCircle2 },
  moderate:  { color: 'bg-amber-50 border-amber-200',     badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500',   label: 'Moderate', icon: Clock },
  urgent:    { color: 'bg-orange-50 border-orange-200',   badge: 'bg-orange-100 text-orange-700',   dot: 'bg-orange-500',  label: 'Urgent', icon: AlertTriangle },
  emergency: { color: 'bg-red-50 border-red-200',         badge: 'bg-red-100 text-red-700',         dot: 'bg-red-500',     label: 'Emergency', icon: AlertTriangle },
}

interface TriageResult {
  severity: string
  confidence: number
  matched_conditions: string[]
  recommendations: { immediate_action?: string; home_care?: string[]; when_to_escalate?: string[] | string; should_book_appointment?: boolean }
  suggested_specializations: string[]
  disclaimer: string
}

export function TriageDemo() {
  const [selected, setSelected] = useState<string[]>([])
  const [age, setAge] = useState(28)
  const [durationIdx, setDurationIdx] = useState(1)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TriageResult | null>(null)
  const [error, setError] = useState('')

  function toggle(s: string) {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
    setResult(null)
  }

  async function analyze() {
    if (selected.length === 0) { setError('Please select at least one symptom.'); return }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/triage/analyze', {
        symptoms: selected.map(s => s.toLowerCase()),
        user_age: age,
        duration_days: DURATIONS[durationIdx].value,
      })
      setResult(data)
    } catch {
      setError('Unable to reach the analysis engine. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? (SEVERITY_CONFIG[result.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.mild) : null
  const homecare = result?.recommendations?.home_care ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">MedAssist AI — Symptom Checker</p>
            <p className="text-xs text-blue-200">Live demo · Powered by real backend</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Symptoms */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Select your symptoms <span className="text-slate-400 font-normal">({selected.length} selected)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    selected.includes(s)
                      ? 'bg-blue-700 border-blue-700 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Age + Duration row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Age: <span className="text-blue-700">{age} years</span></p>
              <div className="flex items-center gap-3">
                <button onClick={() => setAge(a => Math.max(1, a - 1))} className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <Minus className="h-3.5 w-3.5 text-slate-600" />
                </button>
                <input
                  type="range" min={1} max={100} value={age}
                  onChange={e => setAge(Number(e.target.value))}
                  className="flex-1 accent-blue-700 h-1.5"
                />
                <button onClick={() => setAge(a => Math.min(100, a + 1))} className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <Plus className="h-3.5 w-3.5 text-slate-600" />
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Duration</p>
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map((d, i) => (
                  <button
                    key={d.label}
                    onClick={() => setDurationIdx(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      durationIdx === i
                        ? 'bg-blue-700 border-blue-700 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          {/* Analyze button */}
          <motion.button
            onClick={analyze}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analysing symptoms…
              </>
            ) : (
              'Analyze Symptoms →'
            )}
          </motion.button>

          {/* Result */}
          <AnimatePresence>
            {result && cfg && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                className={`rounded-2xl border p-5 ${cfg.color}`}
              >
                {/* Severity badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.round(result.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {result.matched_conditions.length > 0 && (
                  <p className="text-sm font-semibold text-slate-800 mb-1">
                    Possible: {result.matched_conditions.slice(0, 2).join(', ')}
                  </p>
                )}

                {result.recommendations.immediate_action && (
                  <p className="text-sm text-slate-700 mb-3 font-medium">
                    {result.recommendations.immediate_action}
                  </p>
                )}

                {homecare.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {homecare.slice(0, 3).map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {rec}
                      </div>
                    ))}
                  </div>
                )}

                {result.suggested_specializations.length > 0 && (
                  <p className="text-xs text-slate-500 mb-4">
                    Recommended: {result.suggested_specializations[0]}
                  </p>
                )}

                <a href="/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                  >
                    Book Appointment Now →
                  </motion.button>
                </a>

                <p className="text-xs text-slate-400 mt-3 text-center">{result.disclaimer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-4">
        This is AI guidance only — not a medical diagnosis. Always consult a qualified healthcare provider.
      </p>
    </div>
  )
}
