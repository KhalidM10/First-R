import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { SymptomPicker } from '../components/triage/SymptomPicker'
import { DetailsForm, type DetailsData } from '../components/triage/DetailsForm'
import { TriageResults } from '../components/triage/TriageResults'
import { analyzeSymptoms } from '../services/triage'
import type { TriageResult } from '../types/triage'

/* ── ECG loader ───────────────────────────────────────────────── */
function EcgLoader({ count }: { count: number }) {
  return (
    <div className="flex flex-col items-center gap-7 py-10">
      {/* ECG SVG */}
      <svg
        width="260"
        height="64"
        viewBox="0 0 260 64"
        fill="none"
        aria-hidden="true"
        className="text-green-500"
      >
        {/* Ghost path — full ECG shape, muted */}
        <path
          d="M0,32 L72,32 L80,29 L87,7 L93,57 L99,27 L108,32 L260,32"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.12"
        />
        {/* Animated travelling segment */}
        <path
          d="M0,32 L72,32 L80,29 L87,7 L93,57 L99,27 L108,32 L260,32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ecg-line"
        />
        {/* Pulsing dot at the peak */}
        <circle cx="87" cy="7" r="3" fill="currentColor" opacity="0.3" />
      </svg>

      <div className="text-center space-y-1">
        <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>Analysing your symptoms</p>
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Running {count} symptom{count !== 1 ? 's' : ''} through our triage engine…
        </p>
      </div>

      {/* Bouncing dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-green-500 animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Step progress ────────────────────────────────────────────── */
function StepBar({ current }: { current: number }) {
  const labels = ['Symptoms', 'About you', 'Results']
  return (
    <div className="flex items-center gap-0">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-black transition-all duration-300"
                style={
                  done
                    ? { backgroundColor: 'var(--color-brand)', color: '#fff' }
                    : active
                    ? { backgroundColor: 'var(--color-brand)', color: '#fff', boxShadow: '0 0 0 4px var(--color-brand-light)' }
                    : { backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-tertiary)' }
                }
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                style={{ color: active || done ? 'var(--color-brand)' : 'var(--color-text-tertiary)' }}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className="flex-1 h-px mb-5 mx-1 transition-colors duration-500"
                style={{ backgroundColor: i < current ? 'var(--color-brand)' : 'var(--color-border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Types ────────────────────────────────────────────────────── */
type Step = 'symptoms' | 'details' | 'loading' | 'results'

const STEP_TO_INDEX: Record<Step, number> = {
  symptoms: 0,
  details: 1,
  loading: 2,
  results: 2,
}

/* ── Page ─────────────────────────────────────────────────────── */
export function TriagePage() {
  const [step, setStep] = useState<Step>('symptoms')
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [details, setDetails] = useState<DetailsData>({
    age: '', gender: '', county: '', durationDays: '1', conditions: [],
  })
  const [result, setResult] = useState<TriageResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setStep('loading')
    setError(null)
    try {
      const res = await analyzeSymptoms({
        symptoms,
        user_age: details.age ? parseInt(details.age) : undefined,
        user_gender: details.gender || undefined,
        county: details.county || undefined,
        duration_days: details.durationDays ? parseInt(details.durationDays) : undefined,
        pre_existing_conditions: details.conditions.length > 0 ? details.conditions : undefined,
      })
      setResult(res)
      setStep('results')
    } catch {
      setError('Could not reach the server. Please try again.')
      setStep('details')
    }
  }

  function restart() {
    setSymptoms([])
    setDetails({ age: '', gender: '', county: '', durationDays: '1', conditions: [] })
    setResult(null)
    setError(null)
    setStep('symptoms')
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>Symptom Check</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          Describe what you feel — get triage guidance in under 2 minutes.
        </p>
      </div>

      {/* ── Step bar ────────────────────────────────────────── */}
      {step !== 'loading' && <StepBar current={STEP_TO_INDEX[step]} />}

      {/* ── Step: Symptoms ──────────────────────────────────── */}
      {step === 'symptoms' && (
        <div
          key="symptoms"
          className="card p-6 space-y-6 animate-slide-up"
          style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Step 1
            </p>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>What's bothering you today?</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
              Pick from the list or describe it in your own words.
            </p>
          </div>

          <SymptomPicker selected={symptoms} onChange={setSymptoms} />

          <button
            onClick={() => setStep('details')}
            disabled={symptoms.length === 0}
            className="w-full font-bold py-3.5 rounded-xl text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            Continue
            {symptoms.length > 0 && ` — ${symptoms.length} symptom${symptoms.length > 1 ? 's' : ''} selected`}
          </button>
        </div>
      )}

      {/* ── Step: Details ───────────────────────────────────── */}
      {step === 'details' && (
        <div
          key="details"
          className="rounded-2xl p-6 space-y-6 animate-slide-right"
          style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-start gap-3">
            <button
              onClick={() => setStep('symptoms')}
              className="mt-1 text-stone-300 hover:text-stone-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Step 2
              </p>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>A bit about you</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                All optional — but helps us give more accurate guidance.
              </p>
            </div>
          </div>

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-light)' }}
            >
              {error}
            </div>
          )}

          <DetailsForm data={details} onChange={setDetails} />

          <button
            onClick={runAnalysis}
            className="w-full font-bold py-3.5 rounded-xl text-sm text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            Analyse my symptoms
          </button>
        </div>
      )}

      {/* ── Step: Loading ───────────────────────────────────── */}
      {step === 'loading' && (
        <div
          key="loading"
          className="card animate-fade-in"
          style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}
        >
          <EcgLoader count={symptoms.length} />
        </div>
      )}

      {/* ── Step: Results ───────────────────────────────────── */}
      {step === 'results' && result && (
        <TriageResults result={result} onRestart={restart} />
      )}

      {/* ── Footer disclaimer ───────────────────────────────── */}
      {step !== 'results' && step !== 'loading' && (
        <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
          MedAssist AI is a triage guidance tool only — not a diagnostic service.
          Always consult a qualified healthcare professional.
        </p>
      )}
    </div>
  )
}
