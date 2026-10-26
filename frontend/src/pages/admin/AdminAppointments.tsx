import { useEffect, useMemo, useState } from 'react';
import {
  Search, CalendarDays, RefreshCw,
  LayoutDashboard, Stethoscope, Users, FileText,
  BarChart3, Settings, LogOut
} from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatCurrency } from '@/lib/utils';

const API = 'http://localhost:5001/api';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Patients', path: '/admin/patients', icon: Users },
  { label: 'Specializations', path: '/admin/specializations', icon: FileText },
  { label: 'Schedules', path: '/admin/schedules', icon: CalendarDays },
  { label: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings }
];

const STATUSES = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
];

type AppointmentRow = {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  reason?: string | null;
  fee?: number | string | null;
};

function getToken(): string | undefined {
  try {
    return JSON.parse(
      localStorage.getItem('careconnect_auth') || '{}'
    ).token;
  } catch {
    return undefined;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  if (!token) {
    throw new Error('Session missing. Please log in again.');
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed (${response.status})`
    );
  }

  return result;
}

const timeLabel = (value: string) => {
  const [hour, minute] = String(value || '')
    .slice(0, 5)
    .split(':')
    .map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return value;
  }

  return `${String(hour % 12 || 12).padStart(2, '0')}:${String(
    minute
  ).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};

export function AdminAppointments() {
  const { showToast } = useToast();

  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await request('/appointments');
      setRows(result.data || []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load appointments'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const doctors = useMemo(
    () =>
      Array.from(
        new Map(
          rows.map(row => [
            String(row.doctor_id),
            {
              id: String(row.doctor_id),
              name: row.doctor_name
            }
          ])
        ).values()
      ),
    [rows]
  );

  const filtered = rows.filter(appointment => {
    const query = search.toLowerCase();

    const matchesSearch = (
      `${appointment.id} ${appointment.patient_name || ''} ${
        appointment.doctor_name || ''
      }`
    ).toLowerCase().includes(query);

    const matchesStatus =
      !filterStatus || appointment.status === filterStatus;

    const matchesDoctor =
      !filterDoctor ||
      String(appointment.doctor_id) === filterDoctor;

    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const changeStatus = async (
    appointment: AppointmentRow,
    status: string
  ) => {
    setBusyId(appointment.id);

    try {
      await request(`/appointments/${appointment.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          appointment_date: String(
            appointment.appointment_date
          ).slice(0, 10),
          start_time: String(appointment.start_time).slice(0, 8),
          end_time: String(appointment.end_time).slice(0, 8),
          status,
          reason: appointment.reason || null
        })
      });

      setRows(previous =>
        previous.map(row =>
          row.id === appointment.id
            ? { ...row, status }
            : row
        )
      );

      showToast(
        'success',
        'Appointment updated',
        `Status changed to ${status.replace('_', ' ')}.`
      );
    } catch (e) {
      showToast(
        'error',
        'Update failed',
        e instanceof Error
          ? e.message
          : 'Could not update appointment'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout
      items={navItems}
      title="Admin Portal"
      headerTitle="All Appointments"
      headerSubtitle={`${rows.length} appointments from the database`}
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut
      }}
    >
      <Card>
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />

            <input
              className="input pl-10"
              placeholder="Search patient, doctor, or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input sm:w-44"
            value={filterDoctor}
            onChange={e => setFilterDoctor(e.target.value)}
          >
            <option value="">All doctors</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>

          <select
            className="input sm:w-40"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>

          <button
            className="btn-secondary inline-flex items-center justify-center gap-2 px-3"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <p className="mx-4 mb-3 text-sm text-red-600">
            {error}{' '}
            <button className="underline" onClick={() => void load()}>
              Retry
            </button>
          </p>
        )}

        {loading ? (
          <p className="p-8 text-center text-navy-500">
            Loading appointments…
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-navy-100 text-left text-navy-500">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Date / time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Update</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(appointment => (
                  <tr
                    key={appointment.id}
                    className="border-b border-navy-50 hover:bg-navy-50/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      #{appointment.id}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          name={appointment.patient_name || 'Patient'}
                          size="xs"
                        />
                        <span>
                          {appointment.patient_name ||
                            `Patient #${appointment.patient_id}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {appointment.doctor_name ||
                        `Doctor #${appointment.doctor_id}`}
                      <div className="text-xs text-navy-400">
                        {appointment.specialization}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDate(
                        String(appointment.appointment_date).slice(0, 10)
                      )}
                      <div className="text-xs text-navy-500">
                        {timeLabel(appointment.start_time)} –{' '}
                        {timeLabel(appointment.end_time)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={appointment.status} />
                    </td>

                    <td className="px-4 py-3">
                      {appointment.fee == null
                        ? '—'
                        : formatCurrency(Number(appointment.fee))}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        aria-label={`Update appointment ${appointment.id}`}
                        disabled={
                          busyId === appointment.id ||
                          ['cancelled', 'completed', 'no_show'].includes(
                            appointment.status
                          )
                        }
                        className="input min-w-32 py-1"
                        value={appointment.status}
                        onChange={e =>
                          void changeStatus(appointment, e.target.value)
                        }
                      >
                        {STATUSES.map(status => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title="No appointments found"
            description="Try changing your search or filters."
          />
        )}
      </Card>
    </DashboardLayout>
  );
}