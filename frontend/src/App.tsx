import { Navigate, Route, Routes } from 'react-router-dom'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { NotificationToast } from './components/ui/NotificationToast'
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
import { ClinicDoctorsPage }         from './pages/clinic/ClinicDoctorsPage'
import { ClinicPatientsPage }        from './pages/clinic/ClinicPatientsPage'
import { ClinicOrdersPage }          from './pages/clinic/ClinicOrdersPage'
import { ClinicProductsPage }        from './pages/clinic/ClinicProductsPage'
import { ClinicReviewsPage }         from './pages/clinic/ClinicReviewsPage'
import { ClinicSettingsPage }        from './pages/clinic/ClinicSettingsPage'
import { ClinicLoginPage }           from './pages/ClinicLoginPage'
import { ForgotPasswordPage }        from './pages/ForgotPasswordPage'
import { SessionsPage }              from './pages/SessionsPage'
import { HealthProfilePage }         from './pages/HealthProfilePage'
import { NotificationsPage }         from './pages/NotificationsPage'

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


export default function App() {
  return (
    <WebSocketProvider>
      <NotificationToast />
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login"          element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/clinic-login"   element={<GuestRoute><ClinicLoginPage /></GuestRoute>} />
      <Route path="/register"       element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Clinic portal — all clinic staff roles */}
      <Route
        path="/clinic-dashboard"
        element={<ClinicRoute><ClinicLayout /></ClinicRoute>}
      >
        <Route index                element={<ClinicOverviewPage />} />
        <Route path="appointments"  element={<ClinicAppointmentsPage />} />
        <Route path="patients"      element={<ClinicPatientsPage />} />
        <Route path="doctors"       element={<ClinicDoctorsPage />} />
        <Route path="orders"        element={<ClinicOrdersPage />} />
        <Route path="products"      element={<ClinicProductsPage />} />
        <Route path="analytics"     element={<ClinicAnalyticsPage />} />
        <Route path="reviews"       element={<ClinicReviewsPage />} />
        <Route path="audit"         element={<ClinicAuditPage />} />
        <Route path="subscription"  element={<ClinicSubscriptionPage />} />
        <Route path="settings"      element={<ClinicSettingsPage />} />
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
                <Route path="/profile"          element={<HealthProfilePage />} />
                <Route path="/notifications"   element={<NotificationsPage />} />
                <Route path="/sessions"         element={<SessionsPage />} />
                <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
    </WebSocketProvider>
  )
}
