import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, CheckCircle, ChevronLeft, Clock, Stethoscope } from 'lucide-react'
import { api } from '../lib/api'
import type { Clinic, Doctor } from '../types'

const schema = z.object({
  clinic_id: z.string().min(1, 'Please select a clinic'),
  doctor_id: z.string().optional(),
  scheduled_at: z.string().min(1, 'Please pick a date and time'),
  reason: z.string().min(3, 'Describe the reason for your visit'),
})
type FormValues = z.infer<typeof schema>

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30',
]

export function BookAppointmentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const prefillClinicId = searchParams.get('clinic') ?? ''

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [done, setDone] = useState(false)

  const { data: clinics = [] } = useQuery<Clinic[]>({
    queryKey: ['clinics-all'],
    queryFn: async () => {
      const { data } = await api.get('/clinics/', { params: { limit: 50 } })
      return data
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { clinic_id: prefillClinicId },
  })

  const clinicId = watch('clinic_id')

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['doctors', clinicId],
    queryFn: async () => {
      if (!clinicId) return []
      const { data } = await api.get(`/clinics/${clinicId}/doctors`)
      return data
    },
    enabled: !!clinicId,
  })

  const { mutateAsync: book, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const scheduled_at = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
      const { data } = await api.post('/appointments/', { ...values, scheduled_at })
      return data
    },
    onSuccess: () => setDone(true),
  })

  function onSubmit(values: FormValues) {
    if (!selectedDate || !selectedTime) return
    book(values)
  }

  if (done) {
    return (
      <div className="max-w-sm mx-auto flex flex-col items-center py-16 text-center space-y-4 animate-slide-up">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#1a1a18]">Appointment booked!</h2>
          <p className="text-sm text-stone-400 mt-2">
            You'll receive a confirmation shortly. The clinic will contact you to confirm.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full rounded-xl py-3 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#15803d' }}
        >
          Back to dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-stone-300 hover:text-stone-600 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a18] tracking-tight">Book Appointment</h1>
          <p className="text-sm text-stone-400 mt-0.5">Find a slot that works for you</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl p-6 space-y-5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' }}
      >
        {/* Clinic select */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
            Clinic
          </label>
          <select
            {...register('clinic_id')}
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-stone-700 outline-none transition-all"
            style={{ borderColor: errors.clinic_id ? '#f87171' : '#e5e2dc' }}
          >
            <option value="">Select a clinic…</option>
            {clinics.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.county}</option>
            ))}
          </select>
          {errors.clinic_id && (
            <p className="text-xs text-red-500 mt-1">{errors.clinic_id.message}</p>
          )}
        </div>

        {/* Doctor select (optional) */}
        {doctors.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
              Doctor <span className="text-stone-400 font-normal text-xs">(optional)</span>
            </label>
            <select
              {...register('doctor_id')}
              className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-stone-700 outline-none"
              style={{ borderColor: '#e5e2dc' }}
            >
              <option value="">Any available doctor</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.full_name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
            <Calendar className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-stone-700 outline-none transition-all"
            style={{ borderColor: '#e5e2dc' }}
          />
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div>
            <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
              <Clock className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
              Time slot
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setSelectedTime(t); setValue('scheduled_at', `${selectedDate}T${t}`) }}
                  className="rounded-xl border py-2 text-sm font-medium transition-all"
                  style={
                    selectedTime === t
                      ? { backgroundColor: '#15803d', color: 'white', borderColor: '#15803d' }
                      : { backgroundColor: 'white', color: '#57534e', borderColor: '#e5e2dc' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-[#1a1a18] mb-2">
            <Stethoscope className="inline h-3.5 w-3.5 mr-1 mb-0.5" />
            Reason for visit
          </label>
          <textarea
            {...register('reason')}
            rows={3}
            placeholder="e.g. Follow-up on malaria test, persistent headaches…"
            className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm placeholder:text-stone-400 outline-none resize-none transition-all"
            style={{ borderColor: errors.reason ? '#f87171' : '#e5e2dc' }}
          />
          {errors.reason && (
            <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !selectedDate || !selectedTime}
          className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: '#15803d' }}
        >
          {isPending ? 'Booking…' : 'Confirm appointment'}
        </button>
      </form>
    </div>
  )
}
