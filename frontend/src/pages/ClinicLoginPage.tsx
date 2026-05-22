import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Building2, Eye, EyeOff, ShieldCheck,
  Users, ClipboardList, BarChart3,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/auth'
import { CLINIC_ROLES } from '../types'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  totp_code: z.string().optional(),
  backup_code: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const FEATURES = [
  { icon: Users, title: 'Patient Management', desc: 'Full patient history and records' },
  { icon: ClipboardList, title: 'Appointment Flow', desc: 'Schedule, reschedule, and track' },
  { icon: BarChart3, title: 'Clinic Analytics', desc: 'Revenue, capacity, and outcomes' },
]

export function ClinicLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [serverError, setServerError] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError('')
    try {
      await login(values.email, values.password, values.totp_code, values.backup_code)
      const user = useAuthStore.getState().user
      if (!user || !CLINIC_ROLES.includes(user.role)) {
        setServerError('This portal is for clinic staff only. Please use the patient login.')
        useAuthStore.getState().logout()
        return
      }
      navigate('/clinic-dashboard', { replace: true })
    } catch (err: any) {
      if (err?.response?.status === 403 && err?.response?.headers?.['x-2fa-required']) {
        setRequires2FA(true)
        return
      }
      setServerError(err?.response?.data?.detail || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: branding */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col bg-[#0F172A] text-white px-10 py-12">
        <div className="flex items-center gap-3 mb-12">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-base leading-none">MedAssist AI</p>
            <p className="text-xs text-slate-400">Clinic Portal</p>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-3 leading-tight">
            Clinic management,<br />reimagined.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Everything your team needs — from scheduling to analytics — in one secure platform.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">
          © 2026 MedAssist AI · Kenya Health Platform
        </p>
      </div>

      {/* Right: form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white">
        <div className="w-full max-w-sm mx-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">MedAssist AI</p>
              <p className="text-xs text-gray-500">Clinic Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-4 w-4 text-blue-700" />
            </div>
            <span className="text-sm font-medium text-blue-700 bg-blue-50 rounded-md px-2 py-0.5">
              Staff Portal
            </span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your clinic</h1>
          <p className="text-sm text-gray-500 mb-8">
            Use your work email to access the clinic portal
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Work email"
              type="email"
              placeholder="doctor@clinic.com"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <AnimatePresence>
              {requires2FA && (
                <motion.div
                  key="2fa"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-700">
                      Two-factor authentication required
                    </p>
                  </div>
                  <Input
                    label="Authenticator code"
                    placeholder="000000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    error={errors.totp_code?.message}
                    {...register('totp_code')}
                  />
                  <Input
                    label="Or backup code"
                    placeholder="XXXXXXXX"
                    error={errors.backup_code?.message}
                    {...register('backup_code')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              className="w-full bg-blue-700 hover:bg-blue-800 focus-visible:ring-blue-500"
            >
              Sign in to portal
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Not a clinic staff member?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Patient login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
