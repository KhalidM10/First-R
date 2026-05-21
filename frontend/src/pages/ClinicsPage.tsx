import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  Building2, CalendarClock, LayoutGrid, Map,
  MapPin, Search, ShieldCheck, SlidersHorizontal, X,
} from 'lucide-react'
import { api } from '../lib/api'
import type { Clinic } from '../types'

// Fix Leaflet default marker icon for Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COUNTIES = [
  'All counties', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru',
  'Eldoret', 'Thika', 'Garissa', 'Malindi', 'Nyeri', 'Machakos',
]

const SPECIALTIES = [
  'All specialties', 'General Practice', 'Pediatrics', 'Internal Medicine',
  'Obstetrics & Gynaecology', 'Dermatology', 'Orthopaedics', 'Family Medicine',
  'Malaria Clinic', 'Occupational Health',
]

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded-full w-3/5 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-4/5 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-100 rounded-full w-24 animate-pulse" />
        <div className="h-5 bg-gray-100 rounded-full w-20 animate-pulse" />
      </div>
      <div className="h-9 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  )
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  const navigate = useNavigate()
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <Building2 className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 leading-snug">{clinic.name}</h3>
            {clinic.is_verified && (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 truncate">{clinic.address}</span>
          </div>
        </div>
        {clinic.distance_km != null && (
          <span className="shrink-0 text-xs font-medium text-gray-400">
            {clinic.distance_km} km
          </span>
        )}
      </div>

      {/* Specialties */}
      {clinic.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {clinic.specialties.slice(0, 3).map(s => (
            <span
              key={s}
              className="text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-blue-50 text-blue-700"
            >
              {s}
            </span>
          ))}
          {clinic.specialties.length > 3 && (
            <span className="text-[11px] font-medium rounded-full px-2.5 py-0.5 bg-gray-100 text-gray-500">
              +{clinic.specialties.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        {clinic.next_available ? (
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-semibold text-green-700">{clinic.next_available}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-600">Slots available</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/clinics/${clinic.id}`)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/book/${clinic.id}`)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#1E40AF' }}
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  )
}

export function ClinicsPage() {
  const [search, setSearch] = useState('')
  const [county, setCounty] = useState('All counties')
  const [specialty, setSpecialty] = useState('All specialties')
  const [availableToday, setAvailableToday] = useState(false)
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const params: Record<string, string> = { limit: '50' }
  if (county !== 'All counties') params.county = county
  if (specialty !== 'All specialties') params.specialty = specialty
  if (availableToday) params.available_today = 'true'

  const { data: clinics = [], isLoading } = useQuery<Clinic[]>({
    queryKey: ['clinics', county, specialty, availableToday],
    queryFn: async () => {
      const { data } = await api.get('/clinics/', { params })
      return data
    },
  })

  const filtered = clinics.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  )

  const mapClinics = filtered.filter(c => c.latitude != null && c.longitude != null)
  const mapCenter: [number, number] = mapClinics.length > 0
    ? [mapClinics[0].latitude!, mapClinics[0].longitude!]
    : [-1.2921, 36.8219]

  const activeFilters = [
    county !== 'All counties' && county,
    specialty !== 'All specialties' && specialty,
    availableToday && 'Available today',
  ].filter(Boolean) as string[]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Find a Clinic</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isLoading ? 'Loading…' : `${filtered.length} verified clinic${filtered.length !== 1 ? 's' : ''}`}
            {county !== 'All counties' && ` in ${county}`}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              view === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="h-3.5 w-3.5" /> Map
          </button>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm placeholder:text-gray-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={() => setFiltersOpen(v => !v)}
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all ${
            filtersOpen || activeFilters.length > 0
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
          {activeFilters.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-900">Filters</p>
            {activeFilters.length > 0 && (
              <button
                onClick={() => { setCounty('All counties'); setSpecialty('All specialties'); setAvailableToday(false) }}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">County</label>
              <select
                value={county}
                onChange={e => setCounty(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                {COUNTIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Specialty</label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setAvailableToday(v => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${availableToday ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${availableToday ? 'translate-x-4' : ''}`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">Available today</span>
          </label>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(f => (
            <span
              key={f}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 bg-blue-100 text-blue-700"
            >
              {f}
              <button
                onClick={() => {
                  if (f === county) setCounty('All counties')
                  else if (f === specialty) setSpecialty('All specialties')
                  else setAvailableToday(false)
                }}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Map view */}
      {view === 'map' && (
        <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height: 480 }}>
          {mapClinics.length > 0 ? (
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapClinics.map(clinic => (
                <Marker key={clinic.id} position={[clinic.latitude!, clinic.longitude!]}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <p className="font-bold text-sm text-gray-900">{clinic.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{clinic.address}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        {clinic.specialties.slice(0, 2).join(', ')}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <p className="text-sm text-gray-400">No clinics with location data</p>
            </div>
          )}
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No clinics found</p>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((clinic, i) => (
                <div
                  key={clinic.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}
                >
                  <ClinicCard clinic={clinic} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 pb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              All listed clinics are verified by MedAssist AI
            </div>
          )}
        </>
      )}
    </div>
  )
}
