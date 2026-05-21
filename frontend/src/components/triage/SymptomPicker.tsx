import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const SYMPTOM_GROUPS = [
  {
    label: 'Head & Throat',
    symptoms: ['Headache', 'Sore throat', 'Runny nose', 'Dizziness', 'Ear pain'],
  },
  {
    label: 'Chest & Breathing',
    symptoms: ['Cough', 'Chest pain', 'Difficulty breathing', 'Wheezing'],
  },
  {
    label: 'Stomach & Digestion',
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Loss of appetite'],
  },
  {
    label: 'Body & Skin',
    symptoms: ['Fever', 'Fatigue', 'Body aches', 'Chills', 'Rash', 'Joint pain', 'Back pain'],
  },
]

interface Props {
  selected: string[]
  onChange: (symptoms: string[]) => void
}

export function SymptomPicker({ selected, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState<string | null>('Body & Skin')

  function add(symptom: string) {
    const trimmed = symptom.trim()
    if (!trimmed || selected.some(s => s.toLowerCase() === trimmed.toLowerCase())) return
    onChange([...selected, trimmed])
    setDraft('')
  }

  function remove(symptom: string) {
    onChange(selected.filter(s => s !== symptom))
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); add(draft) }
  }

  const isActive = (label: string) =>
    selected.some(s => s.toLowerCase() === label.toLowerCase())

  return (
    <div className="space-y-5">

      {/* Selected symptoms */}
      {selected.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
            Added symptoms
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  border: '1.5px solid #86efac',
                }}
              >
                {s}
                <button
                  onClick={() => remove(s)}
                  className="transition-opacity hover:opacity-60"
                  aria-label={`Remove ${s}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Free-text input */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          Describe a symptom in your own words
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. sharp pain in lower right abdomen"
            className="flex-1 rounded-xl border bg-white px-4 py-2.5 text-sm text-[#1a1a18] placeholder:text-stone-400 outline-none transition-all"
            style={{ borderColor: '#e5e2dc' }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#16a34a'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21,128,61,0.1)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#e5e2dc'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <button
            onClick={() => add(draft)}
            disabled={!draft.trim()}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: '#15803d' }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Grouped symptom list */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">
          Or select from the list below
        </p>
        <div className="space-y-2">
          {SYMPTOM_GROUPS.map(group => (
            <div
              key={group.label}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid #e5e2dc' }}
            >
              <button
                type="button"
                onClick={() => setExpanded(v => v === group.label ? null : group.label)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white text-left transition-colors hover:bg-stone-50"
              >
                <span className="text-sm font-semibold text-[#1a1a18]">{group.label}</span>
                <div className="flex items-center gap-2">
                  {group.symptoms.some(isActive) && (
                    <span
                      className="text-[10px] font-bold rounded-full px-2 py-0.5"
                      style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
                    >
                      {group.symptoms.filter(isActive).length} selected
                    </span>
                  )}
                  <span
                    className="text-stone-400 text-xs transition-transform duration-200"
                    style={{ transform: expanded === group.label ? 'rotate(180deg)' : 'none' }}
                  >
                    ▾
                  </span>
                </div>
              </button>

              {expanded === group.label && (
                <div
                  className="flex flex-wrap gap-2 px-4 pb-3 pt-2"
                  style={{ borderTop: '1px solid #f4f3ef', backgroundColor: '#fafaf9' }}
                >
                  {group.symptoms.map(symptom => {
                    const active = isActive(symptom)
                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => active ? remove(symptom) : add(symptom)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-150',
                          active
                            ? 'text-white border-transparent'
                            : 'bg-white text-stone-600 hover:border-green-400 hover:text-green-800',
                        )}
                        style={
                          active
                            ? { backgroundColor: '#15803d', borderColor: '#15803d' }
                            : { borderColor: '#e5e2dc' }
                        }
                      >
                        {symptom}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
