import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ClinicLayout } from './components/clinic/ClinicLayout'
import { useAuthStore } from './store/auth'
import { CLINIC_ROLES } from './types'
import { LandingPage }                from './pages/LandingPage'
import { DashboardPage }              from './pages/DashboardPage'
import { LoginPage }                  from './pages/LoginPage'
import { RegisterPage }               from './pages/RegisterPage'
import { TriagePage }                 from './pages/TriagePage'
import { ClinicsPage }                from './pages/ClinicsPage'
import { ClinicProfilePage }          from './pages/ClinicProfilePage'
import { BookingFlow }                from './pages/BookingFlow'
import { AppointmentsPage }           from './pages/AppointmentsPage'
import { MedicineOrderPage }          from './pages/MedicineOrderPage'
import { ClinicOverviewPage }         from './pages/clinic/ClinicOverviewPage'
import { ClinicAppointmentsPage }     from './pages/clinic/ClinicAppointmentsPage'
import { ClinicAnalyticsPage }        from './pages/clinic/ClinicAnalyticsPage'
import { ClinicSubscriptionPage }     from './pages/clinic/ClinicSubscriptionPage'
import { ClinicAuditPage }           from './pages/clinic/ClinicAuditPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <>{children}</>
  if (user && CLINIC_ROLES.includes(user.role)) {
    return <Navigate to="/clinic-dashboard" replace />
  }
  return <Navigate to="/dashboard" replace />
}

function ClinicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || !CLINIC_ROLES.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

function PatientOrClinicRedirect() {
  const { user } = useAuthStore()
  if (user && CLINIC_ROLES.includes(user.role)) {
    return <Navigate to="/clinic-dashboard" replace />
  }
  return <DashboardPage />
}

function ProfilePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <span className="text-2xl text-gray-400">P</span>
      </div>
      <h1 className="text-lg font-bold text-gray-900">Patient Profile</h1>
      <p className="text-sm text-gray-400 mt-1">Profile editing — coming soon</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Clinic portal — all clinic staff roles */}
      <Route
        path="/clinic-dashboard"
        element={<ClinicRoute><ClinicLayout /></ClinicRoute>}
      >
        <Route index                element={<ClinicOverviewPage />} />
        <Route path="appointments"  element={<ClinicAppointmentsPage />} />
        <Route path="analytics"     element={<ClinicAnalyticsPage />} />
        <Route path="subscription"  element={<ClinicSubscriptionPage />} />
        <Route path="audit"         element={<ClinicAuditPage />} />
      </Route>

      {/* Protected patient app shell */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/dashboard"        element={<PatientOrClinicRedirect />} />
                <Route path="/triage"           element={<TriagePage />} />
                <Route path="/clinics"          element={<ClinicsPage />} />
                <Route path="/clinics/:id"      element={<ClinicProfilePage />} />
                <Route path="/book/:clinicId"   element={<BookingFlow />} />
                <Route path="/appointments"     element={<AppointmentsPage />} />
                <Route path="/appointments/new" element={<Navigate to="/clinics" replace />} />
                <Route path="/medicines"        element={<MedicineOrderPage />} />
                <Route path="/profile"          element={<ProfilePlaceholder />} />
                <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
