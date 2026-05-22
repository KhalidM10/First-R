import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, ArrowLeft, CheckCircle2, Mail, KeyRound, ShieldCheck,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter'
import { api } from '../lib/api'

type Step = 'email' | 'sent' | 'reset' | 'success'

// Step 1
const emailSchema = z.object({ email: z.string().email('Enter a valid email') })
type EmailForm = z.infer<typeof emailSchema>

// Step 3
const resetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    new_password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Need uppercase')
      .regex(/[0-9]/, 'Need number')
      .regex(/[^A-Za-z0-9]/, 'Need special character'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })
type ResetForm = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })
  const newPassword = resetForm.watch('new_password') || ''

  async function onRequestReset(values: EmailForm) {
    await api.post('/auth/forgot-password', null, { params: { email: values.email } })
    setEmail(values.email)
    setStep('sent')
  }

  async function onResetPassword(values: ResetForm) {
    await api.post('/auth/reset-password', null, {
      params: { token: values.token, new_password: values.new_password },
    })
    setStep('success')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 shadow-sm">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg leading-none">MedAssist AI</p>
            <p className="text-xs text-gray-500">Kenya Health Platform</p>
          </div>
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-5">
                  <Mail className="h-6 w-6 text-blue-700" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Forgot your password?</h1>
                <p className="text-sm text-gray-500 mb-6">
                  Enter your email and we&apos;ll send you a reset link.
                </p>

                <form
                  onSubmit={emailForm.handleSubmit(onRequestReset)}
                  className="flex flex-col gap-4"
                >
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    error={emailForm.formState.errors.email?.message}
                    {...emailForm.register('email')}
                  />
                  {emailForm.formState.errors.root && (
                    <p className="text-sm text-red-500">
                      {emailForm.formState.errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    loading={emailForm.formState.isSubmitting}
                    size="lg"
                    className="w-full bg-blue-700 hover:bg-blue-800"
                  >
                    Send reset link
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Step 2: Sent */}
            {step === 'sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 mb-5">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Check your inbox</h1>
                <p className="text-sm text-gray-500 mb-2">
                  We sent a reset link to
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-6 break-all">{email}</p>

                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-6">
                  <p className="text-xs text-amber-700">
                    Didn&apos;t receive it? Check your spam folder or wait a minute and try again.
                    The link expires in <strong>1 hour</strong>.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full mb-3"
                  onClick={() => setStep('reset')}
                >
                  I have my reset code
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Try a different email
                </button>
              </motion.div>
            )}

            {/* Step 3: Reset form */}
            {step === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 mb-5">
                  <KeyRound className="h-6 w-6 text-blue-700" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Set new password</h1>
                <p className="text-sm text-gray-500 mb-6">
                  Enter the token from your email and your new password.
                </p>

                <form
                  onSubmit={resetForm.handleSubmit(onResetPassword)}
                  className="flex flex-col gap-4"
                >
                  <Input
                    label="Reset token"
                    placeholder="Paste token from email"
                    error={resetForm.formState.errors.token?.message}
                    {...resetForm.register('token')}
                  />
                  <div>
                    <Input
                      label="New password"
                      type="password"
                      placeholder="Min. 8 characters"
                      error={resetForm.formState.errors.new_password?.message}
                      {...resetForm.register('new_password')}
                    />
                    <PasswordStrengthMeter password={newPassword} />
                  </div>
                  <Input
                    label="Confirm new password"
                    type="password"
                    placeholder="Repeat password"
                    error={resetForm.formState.errors.confirm_password?.message}
                    {...resetForm.register('confirm_password')}
                  />
                  {resetForm.formState.errors.root && (
                    <p className="text-sm text-red-500">
                      {resetForm.formState.errors.root.message}
                    </p>
                  )}
                  <Button
                    type="submit"
                    loading={resetForm.formState.isSubmitting}
                    size="lg"
                    className="w-full bg-blue-700 hover:bg-blue-800"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" /> Reset password
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setStep('sent')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-5">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h1>
                <p className="text-sm text-gray-500 mb-8">
                  Your password has been changed. You can now sign in with your new credentials.
                </p>
                <Link to="/login">
                  <Button size="lg" className="w-full bg-blue-700 hover:bg-blue-800">
                    Sign in now
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
