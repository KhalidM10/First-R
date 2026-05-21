import { cn } from '../../lib/utils'

const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
  'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
  'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a", 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
]

const GENDERS = [
  { value: 'Male',              label: 'Male' },
  { value: 'Female',            label: 'Female' },
  { value: 'Other',             label: 'Other' },
  { value: 'Prefer not to say', label: 'N/A' },
]

const CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart disease', 'COPD',
  'HIV', 'Epilepsy', 'Sickle cell', 'Kidney disease', 'Pregnancy',
  'Immunocompromised',
]

export interface DetailsData {
  age: string
  gender: string
  county: string
  durationDays: string
  conditions: string[]
}

interface Props {
  data: DetailsData
  onChange: (data: DetailsData) => void
}

const fieldStyle: React.CSSProperties = {
  borderColor: '#e5e2dc',
  backgroundColor: 'white',
}

export function DetailsForm({ data, onChange }: Props) {
  function set<K extends keyof DetailsData>(key: K, value: DetailsData[K]) {
    onChange({ ...data, [key]: value })
  }

  function toggleCondition(c: string) {
    const next = data.conditions.includes(c)
      ? data.conditions.filter(x => x !== c)
      : [...data.conditions, c]
    set('conditions', next)
  }

  function fieldClass(base = '') {
    return cn(
      'w-full rounded-xl border px-4 py-2.5 text-sm text-[#1a1a18] placeholder:text-stone-400 outline-none transition-all',
      base,
    )
  }

  return (
    <div className="space-y-7">

      {/* Age */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
          How old are you? <span className="text-stone-400 font-normal text-xs">(optional)</span>
        </label>
        <input
          type="number"
          min={0}
          max={120}
          value={data.age}
          onChange={e => set('age', e.target.value)}
          placeholder="32"
          className={fieldClass('w-32')}
          style={fieldStyle}
          onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21,128,61,0.1)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e5e2dc'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
          Gender <span className="text-stone-400 font-normal text-xs">(optional)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {GENDERS.map(g => (
            <button
              key={g.value}
              type="button"
              onClick={() => set('gender', data.gender === g.value ? '' : g.value)}
              className={cn(
                'rounded-xl border px-4 py-2 text-sm font-medium transition-all',
                data.gender === g.value
                  ? 'bg-[#15803d] text-white border-[#15803d]'
                  : 'bg-white text-stone-600 hover:border-green-400',
              )}
              style={data.gender === g.value ? {} : fieldStyle}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration + County */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
            How many days?
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={data.durationDays}
            onChange={e => set('durationDays', e.target.value)}
            placeholder="1"
            className={fieldClass()}
            style={fieldStyle}
            onFocus={e => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21,128,61,0.1)' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e5e2dc'; e.currentTarget.style.boxShadow = 'none' }}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
            Your county <span className="text-stone-400 font-normal text-xs">(optional)</span>
          </label>
          <select
            value={data.county}
            onChange={e => set('county', e.target.value)}
            className={fieldClass('appearance-none cursor-pointer')}
            style={fieldStyle}
          >
            <option value="">Select…</option>
            {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Pre-existing conditions */}
      <div>
        <label className="block text-sm font-semibold text-[#1a1a18] mb-1">
          Any pre-existing conditions?
        </label>
        <p className="text-xs text-stone-400 mb-3">These help us give you more accurate guidance.</p>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => {
            const active = data.conditions.includes(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCondition(c)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all',
                  active
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-stone-600 hover:border-amber-400 hover:text-amber-800',
                )}
                style={active ? {} : { borderColor: '#e5e2dc' }}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
