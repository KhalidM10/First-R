import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter'
import { useAuthStore } from '../store/auth'
import { cn } from '../lib/utils'

const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
  'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', "Murang'a",
  'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
  'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans Nzoia',
  'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
]

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const schema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    phone: z.string().regex(/^\+254\d{9}$/, 'Format: +254XXXXXXXXX'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
    confirm_password: z.string(),
    county: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    date_of_birth: z.string().optional(),
    blood_type: z.string().optional(),
    allergies: z.string().optional(),
    emergency_contact_name: z.string().optional(),
    emergency_contact_phone: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type FormValues = z.infer<typeof schema>

const STEPS = [
  { label: 'Account', description: 'Name, email & password' },
  { label: 'Location', description: 'County & demographics' },
  { label: 'Health', description: 'Medical profile' },
]

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['full_name', 'email', 'phone', 'password', 'confirm_password'],
  ['county', 'gender', 'date_of_birth'],
  ['blood_type', 'allergies', 'emergency_contact_name', 'emergency_contact_phone'],
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })

  const password = watch('password') || ''

  async function nextStep() {
    const valid = await trigger(STEP_FIELDS[step] as any)
    if (valid) setStep((s) => s + 1)
  }

  async function onSubmit(values: FormValues) {
    setServerError('')
    try {
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        county: values.county || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setServerError(err?.response?.data?.detail || 'Registration failed. Please try again.')
      setStep(0)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 shadow-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-none">MedAssist AI</p>
            <p className="text-xs text-gray-500">Kenya Health Platform</p>
          </div>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Progress bar */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, i) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                      i < step
                        ? 'bg-blue-700 text-white'
                        : i === step
                          ? 'bg-blue-700 text-white ring-4 ring-blue-100'
                          : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    {i < step ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className={cn('text-xs font-semibold', i <= step ? 'text-gray-900' : 'text-gray-400')}>
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-400">{s.description}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'hidden sm:block flex-1 h-px w-12 mx-2 transition-all',
                        i < step ? 'bg-blue-700' : 'bg-gray-200',
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-700 rounded-full"
                animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Form area */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-8 py-6 min-h-[360px]">
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    <h2 className="text-lg font-semibold text-gray-900">Create your account</h2>
                    <Input
                      label="Full name"
                      placeholder="Jane Wanjiku"
                      error={errors.full_name?.message}
                      {...register('full_name')}
                    />
                    <Input
                      label="Email address"
                      type="email"
                      placeholder="you@example.com"
                      error={errors.email?.message}
                      {...register('email')}
                    />
                    <Input
                      label="Phone number"
                      type="tel"
                      placeholder="+254712345678"
                      hint="Kenya number (+254XXXXXXXXX)"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />
                    <div>
                      <Input
                        label="Password"
                        type="password"
                        placeholder="Min. 8 characters"
                        error={errors.password?.message}
                        {...register('password')}
                      />
                      <PasswordStrengthMeter password={password} />
                    </div>
                    <Input
                      label="Confirm password"
                      type="password"
                      placeholder="Repeat password"
                      error={errors.confirm_password?.message}
                      {...register('confirm_password')}
                    />
                  </motion.div>
                )}

                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    <h2 className="text-lg font-semibold text-gray-900">Your location</h2>
                    <p className="text-sm text-gray-500 -mt-2">
                      Helps us find nearby clinics and services.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">County</label>
                      <select
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...register('county')}
                      >
                        <option value="">Select county (optional)</option>
                        {KENYAN_COUNTIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Gender <span className="text-gray-400 font-normal">(optional)</span></label>
                      <select
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...register('gender')}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <Input
                      label="Date of birth"
                      type="date"
                      hint="Optional — used for age-appropriate care"
                      {...register('date_of_birth')}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Health profile</h2>
                      <p className="text-sm text-gray-500">All fields optional — helps your doctor.</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Blood type</label>
                      <select
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        {...register('blood_type')}
                      >
                        <option value="">Unknown</option>
                        {BLOOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Known allergies</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Penicillin, peanuts"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        {...register('allergies')}
                      />
                    </div>
                    <Input
                      label="Emergency contact name"
                      placeholder="John Wanjiku"
                      {...register('emergency_contact_name')}
                    />
                    <Input
                      label="Emergency contact phone"
                      type="tel"
                      placeholder="+254712345678"
                      {...register('emergency_contact_phone')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {serverError && (
              <div className="mx-8 mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* Navigation */}
            <div className="px-8 pb-8 flex items-center justify-between gap-3">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 focus-visible:ring-blue-500"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 focus-visible:ring-blue-500"
                >
                  <Check className="h-4 w-4" /> Create account
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
