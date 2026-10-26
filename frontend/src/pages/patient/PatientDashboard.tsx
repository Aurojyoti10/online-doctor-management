

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Bell,
  LayoutDashboard,
  Search,
  CalendarDays,
  FileText,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { AppointmentCard } from '@/components/shared/AppointmentCard';
import { EmptyState } from '@/components/ui/States';
import { useAuth } from '@/context/AuthContext';
import { getGreeting, formatDate } from '@/lib/utils';

const API_URL = 'http://localhost:5001/api';

type PatientAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  date: string;
  time: string;
  consultationType: string;
  status: string;
  fee: number;
  paymentStatus: string;
  reason: string;
  createdAt: string;
};

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
  { label: 'Profile', path: '/patient/profile', icon: User },
  { label: 'Settings', path: '/patient/settings', icon: Settings },
];

export function PatientDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAppointments() {
      if (!user || !token) {
        setError('Please log in again to view your appointments.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_URL}/appointments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || `Failed to load appointments (${response.status}).`
          );
        }

        const rows = Array.isArray(result.data) ? result.data : [];

        const mapped: PatientAppointment[] = rows.map((row: any) => ({
          id: String(row.id),
          patientId: String(row.patient_id ?? ''),
          patientName: user.name || 'Patient',
          doctorId: String(row.doctor_id ?? ''),
          doctorName:
            row.doctor_name ||
            row.name ||
            (row.doctor_id ? `Doctor #${row.doctor_id}` : 'Doctor'),
          doctorSpecialization:
            row.specialization || 'Medical consultation',
          date: String(row.appointment_date || '').slice(0, 10),
          time: String(row.start_time || '').slice(0, 5),
          consultationType: 'in-person',
          status: String(row.status || 'scheduled').toLowerCase(),
          fee: Number(row.consultation_fee ?? row.amount ?? 0),
          paymentStatus: String(row.payment_status || 'pending'),
          reason: String(row.reason || ''),
          createdAt: String(row.created_at || ''),
        }));

        if (active) {
          setAppointments(mapped);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load appointments.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAppointments();

    return () => {
      active = false;
    };
  }, [user, token]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(`${appointment.date}T00:00:00`);

      return (
        ['scheduled', 'confirmed', 'pending'].includes(appointment.status) &&
        !Number.isNaN(appointmentDate.getTime()) &&
        appointmentDate >= today
      );
    })
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time || '00:00'}`).getTime() -
        new Date(`${b.date}T${b.time || '00:00'}`).getTime()
    );

  const past = appointments.filter((appointment) =>
    ['completed', 'no_show'].includes(appointment.status)
  );

  const quickActions = [
    { label: 'Find Doctors', icon: Search, path: '/patient/doctors' },
    { label: 'Appointments', icon: Calendar, path: '/patient/appointments' },
    { label: 'Prescriptions', icon: FileText, path: '/patient/prescriptions' },
    { label: 'Profile', icon: User, path: '/patient/profile' },
  ];

  return (
    <DashboardLayout
      items={navItems}
      title="Patient Portal"
      headerTitle={`${getGreeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
      headerSubtitle="Here's your health overview"
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut,
      }}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Upcoming Appointments"
          value={loading ? '—' : upcoming.length}
          icon={Calendar}
          color="primary"
        />

        <StatCard
          label="Past Appointments"
          value={loading ? '—' : past.length}
          icon={Clock}
          color="teal"
        />

        <StatCard
          label="Prescriptions"
          value="—"
          icon={FileText}
          color="success"
        />
      </div>

      {upcoming.length > 0 && (
        <Card className="mb-6 border-primary-100 bg-gradient-to-br from-primary-50 to-teal-50 p-5">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
                <Calendar className="h-6 w-6 text-white" />
              </div>

              <div>
                <p className="text-xs font-medium text-primary-600">
                  Next Appointment
                </p>
                <p className="font-semibold text-navy-900">
                  {upcoming[0].doctorName}
                </p>
                <p className="text-sm text-navy-600">
                  {upcoming[0].doctorSpecialization} ·{' '}
                  {formatDate(upcoming[0].date)} at {upcoming[0].time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={upcoming[0].status} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/patient/appointments')}
              >
                View Details
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/patient/appointments')}
                >
                  View all
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p className="py-8 text-center text-sm text-navy-500">
                  Loading your appointments…
                </p>
              ) : error ? (
                <div className="rounded-lg border border-error-100 bg-error-50 p-4">
                  <p className="text-sm text-error-600">{error}</p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No upcoming appointments"
                  description="Book an appointment with a doctor today."
                  action={
                    <Button
                      size="sm"
                      onClick={() => navigate('/patient/doctors')}
                    >
                      Find Doctors
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 3).map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment as any}
                      onView={() =>
                        navigate(`/patient/appointments/${appointment.id}`)
                      }
                      onCancel={() => navigate('/patient/appointments')}
                      onReschedule={() => navigate('/patient/appointments')}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="card-hover p-4 text-center"
              >
                <action.icon className="mx-auto mb-2 h-6 w-6 text-primary-600" />
                <p className="text-xs font-medium text-navy-700">
                  {action.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-teal-100 bg-gradient-to-br from-teal-50 to-primary-50 p-5">
            <h3 className="mb-2 text-sm font-semibold text-navy-900">
              Health Tip of the Day
            </h3>
            <p className="text-sm leading-relaxed text-navy-600">
              Stay hydrated throughout the day. Drinking enough water supports
              normal body function and overall well-being.
            </p>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-navy-400" />
              <h3 className="text-sm font-semibold text-navy-900">
                Recent Activity
              </h3>
            </div>

            {past.length === 0 ? (
              <p className="text-xs text-navy-500">
                Completed consultations will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {past.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-start gap-2 text-xs text-navy-500"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" />
                    <p>
                      Consultation with {appointment.doctorName} on{' '}
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
