
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { AppointmentCard } from '@/components/shared/AppointmentCard';
import { EmptyState } from '@/components/ui/States';
import { ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import type { Appointment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  FileText,
  Activity,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
  { label: 'Medical History', path: '/patient/medical-history', icon: Activity },
  { label: 'Profile', path: '/patient/profile', icon: User },
  { label: 'Settings', path: '/patient/settings', icon: Settings },
];

const tabs = ['Upcoming', 'Completed', 'Cancelled'] as const;

export function PatientAppointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>('Upcoming');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = useCallback(async () => {
    if (!token || !user) {
      setLocalAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/appointments', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load appointments');
      }

      const rows = result.data || [];

      setLocalAppointments(
        rows.map((row: any) => ({
          id: String(row.id),
          patientId: String(row.patient_id),
          patientName: user.name,
          doctorId: String(row.doctor_id),
          doctorName: row.doctor_name || `Doctor #${row.doctor_id}`,
          doctorSpecialization: row.specialization || 'Medical consultation',
          date:
            typeof row.appointment_date === 'string'
              ? row.appointment_date.slice(0, 10)
              : new Date(row.appointment_date).toISOString().slice(0, 10),
          time: String(row.start_time).slice(0, 5),
          consultationType: 'in-person',
          status: row.status === 'scheduled' ? 'confirmed' : row.status,
          fee: Number(row.fee || row.consultation_fee || 0),
          paymentStatus: 'pending',
          reason: row.reason || '',
          createdAt: row.created_at || '',
        })),
      );
    } catch (error) {
      console.error('Patient appointments:', error);
      showToast(
        'error',
        'Could not load appointments',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [token, user, showToast]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments, location.key]);

  const filtered = localAppointments.filter((appointment) => {
    if (activeTab === 'Upcoming') {
      return ['confirmed', 'pending', 'scheduled'].includes(appointment.status);
    }

    if (activeTab === 'Completed') {
      return appointment.status === 'completed';
    }

    return ['cancelled', 'rejected'].includes(appointment.status);
  });

  const handleCancel = async () => {
    if (!cancelTarget || !token || cancelling) return;

    setCancelling(true);

    try {
      const response = await fetch(
        `http://localhost:5001/api/appointments/${encodeURIComponent(cancelTarget)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to cancel appointment');
      }

      setCancelTarget(null);
      await loadAppointments();

      showToast(
        'success',
        'Appointment Cancelled',
        'Your appointment has been cancelled.',
      );
    } catch (error) {
      console.error('Cancel appointment:', error);
      showToast(
        'error',
        'Cancellation failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DashboardLayout
      items={navItems}
      title="Patient Portal"
      headerTitle="My Appointments"
      headerSubtitle="View and manage your appointments"
      footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}
    >
      <div className="mb-6 flex w-full gap-1 rounded-xl border border-navy-100 bg-white p-1 sm:inline-flex sm:w-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
              activeTab === tab
                ? 'bg-primary-50 text-primary-700'
                : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            {tab}{' '}
            <span className="ml-1 text-xs text-navy-400">
              (
              {localAppointments.filter((appointment) =>
                tab === 'Upcoming'
                  ? ['confirmed', 'pending', 'scheduled'].includes(appointment.status)
                  : tab === 'Completed'
                    ? appointment.status === 'completed'
                    : ['cancelled', 'rejected'].includes(appointment.status),
              ).length}
              )
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="p-6 text-sm text-navy-500">
            Loading appointments…
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title={
              activeTab === 'Upcoming'
                ? 'No upcoming appointments'
                : activeTab === 'Completed'
                  ? 'No completed appointments'
                  : 'No cancelled appointments'
            }
            description={
              activeTab === 'Upcoming'
                ? 'Book an appointment with a doctor today.'
                : 'Your appointment history will appear here.'
            }
            action={
              activeTab === 'Upcoming' ? (
                <button
                  className="btn-primary"
                  onClick={() => navigate('/patient/doctors')}
                >
                  Find Doctors
                </button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onView={() => navigate(`/patient/appointments/${appointment.id}`)}
              onReschedule={() =>
                showToast(
                  'info',
                  'Reschedule',
                  'Reschedule feature will open the booking flow.',
                )
              }
              onCancel={() => setCancelTarget(appointment.id)}
              onRate={() =>
                showToast('success', 'Thank you!', 'Rating submitted successfully.')
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => {
          if (!cancelling) setCancelTarget(null);
        }}
        onConfirm={handleCancel}
        title="Cancel Appointment?"
        description="Are you sure you want to cancel this appointment?"
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, Cancel Appointment'}
      />
    </DashboardLayout>
  );
}
