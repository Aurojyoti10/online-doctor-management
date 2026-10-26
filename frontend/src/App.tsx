

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { type ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider, useToast } from '@/context/ToastContext';
import { Toast, ToastViewport } from '@/components/ui/Toast';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { GlobalBackButton } from '@/components/shared/GlobalBackButton';

import { LandingPage } from '@/pages/LandingPage';
import { SearchDoctorsPage } from '@/pages/SearchDoctorsPage';
import { DoctorProfilePage } from '@/pages/DoctorProfilePage';
import { BookingPage } from '@/pages/BookingPage';
import { SpecializationsPage } from '@/pages/SpecializationsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { PatientAppointments } from '@/pages/patient/PatientAppointments';
import {
  PatientPrescriptions,
  PrescriptionDetail,
} from '@/pages/patient/PatientPrescriptions';
import { PatientProfile } from '@/pages/patient/PatientProfile';
import { PatientSettings } from '@/pages/patient/PatientSettings';

import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { DoctorAppointments } from '@/pages/doctor/DoctorAppointments';
import {
  DoctorPatients,
  DoctorPatientDetail,
} from '@/pages/doctor/DoctorPatients';
import { DoctorAvailability } from '@/pages/doctor/DoctorAvailability';
import { ConsultationPage } from '@/pages/doctor/ConsultationPage';
import { DoctorPrescriptions } from '@/pages/doctor/DoctorPrescriptions';
import { DoctorEarnings } from '@/pages/doctor/DoctorEarnings';
import {
  DoctorReviews,
  DoctorProfile,
  DoctorSettings,
} from '@/pages/doctor/DoctorReviews';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminDoctors } from '@/pages/admin/AdminDoctors';
import { AdminPatients } from '@/pages/admin/AdminPatients';
import { AdminSpecializations } from '@/pages/admin/AdminSpecializations';
import { AdminSchedules } from '@/pages/admin/AdminSchedules';
import { AdminAppointments } from '@/pages/admin/AdminAppointments';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminSettings } from '@/pages/admin/AdminSettings';

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastViewport>
  );
}

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role: 'patient' | 'doctor' | 'admin';
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <GlobalBackButton />

      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <LandingPage />
            </PublicLayout>
          }
        />

        <Route
          path="/doctors"
          element={
            <PublicLayout>
              <SearchDoctorsPage />
            </PublicLayout>
          }
        />

        <Route path="/doctors/:id" element={<DoctorProfilePage />} />
        <Route path="/doctors/:id/book" element={<BookingPage />} />

        <Route
          path="/specializations"
          element={
            <PublicLayout>
              <SpecializationsPage />
            </PublicLayout>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Patient routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/doctors"
          element={
            <ProtectedRoute role="patient">
              <SearchDoctorsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute role="patient">
              <PatientAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/appointments/:id"
          element={
            <ProtectedRoute role="patient">
              <PatientAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute role="patient">
              <PatientPrescriptions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/prescriptions/:id"
          element={
            <ProtectedRoute role="patient">
              <PrescriptionDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute role="patient">
              <PatientProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/settings"
          element={
            <ProtectedRoute role="patient">
              <PatientSettings />
            </ProtectedRoute>
          }
        />

        {/* Doctor routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute role="doctor">
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/appointments/:id"
          element={
            <ProtectedRoute role="doctor">
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/patients"
          element={
            <ProtectedRoute role="doctor">
              <DoctorPatients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/patients/:id"
          element={
            <ProtectedRoute role="doctor">
              <DoctorPatientDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/availability"
          element={
            <ProtectedRoute role="doctor">
              <DoctorAvailability />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/consultation/:id"
          element={
            <ProtectedRoute role="doctor">
              <ConsultationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/prescriptions"
          element={
            <ProtectedRoute role="doctor">
              <DoctorPrescriptions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/reviews"
          element={
            <ProtectedRoute role="doctor">
              <DoctorReviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/earnings"
          element={
            <ProtectedRoute role="doctor">
              <DoctorEarnings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute role="doctor">
              <DoctorProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/settings"
          element={
            <ProtectedRoute role="doctor">
              <DoctorSettings />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <ProtectedRoute role="admin">
              <AdminDoctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/doctors/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminDoctors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/patients"
          element={
            <ProtectedRoute role="admin">
              <AdminPatients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/patients/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminPatients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/specializations"
          element={
            <ProtectedRoute role="admin">
              <AdminSpecializations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/schedules"
          element={
            <ProtectedRoute role="admin">
              <AdminSchedules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute role="admin">
              <AdminAppointments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute role="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute role="admin">
              <AdminSettings />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
