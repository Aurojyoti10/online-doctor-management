
import { useEffect, useState } from 'react';
import {
  Calendar, Clock, Edit2, Plus, Trash2, Save,
  LayoutDashboard, Stethoscope, Users, CalendarDays,
  FileText, BarChart3, Settings, LogOut
} from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';

const API = 'http://localhost:5001/api';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Patients', path: '/admin/patients', icon: Users },
  { label: 'Specializations', path: '/admin/specializations', icon: FileText },
  { label: 'Schedules', path: '/admin/schedules', icon: CalendarDays },
  { label: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const DAYS = [
  { short: 'Mon', full: 'monday' },
  { short: 'Tue', full: 'tuesday' },
  { short: 'Wed', full: 'wednesday' },
  { short: 'Thu', full: 'thursday' },
  { short: 'Fri', full: 'friday' },
  { short: 'Sat', full: 'saturday' },
  { short: 'Sun', full: 'sunday' },
];

type Doctor = {
  id: number;
  name: string;
  specialization: string;
};

type Schedule = {
  id: number;
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: number | boolean;
};

type TimeRange = {
  start: string;
  end: string;
};

function token() {
  try {
    return JSON.parse(
      localStorage.getItem('careconnect_auth') || '{}'
    ).token as string | undefined;
  } catch {
    return undefined;
  }
}

async function api(path: string, options: RequestInit = {}) {
  const authToken = token();

  if (!authToken) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Request failed');
  }

  return result;
}

function displayTime(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;

  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelveHour = hours % 12 || 12;

  return `${String(twelveHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function timeTo24(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) return value.slice(0, 5);

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const suffix = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes > 59) return '';

  if (suffix === 'AM' && hours === 12) hours = 0;
  if (suffix === 'PM' && hours !== 12) hours += 12;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function AdminSchedules() {
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [editDay, setEditDay] = useState<string | null>(null);
  const [ranges, setRanges] = useState<TimeRange[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedDoctor = doctors.find(
    doctor => String(doctor.id) === doctorId
  );

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [doctorResult, scheduleResult] = await Promise.all([
        api('/doctors'),
        api('/admin/schedules'),
      ]);

      const doctorRows = (doctorResult.data || []).map((d: any) => ({
        id: Number(d.id),
        name: d.name || d.doctor_name || `Doctor #${d.id}`,
        specialization: d.specialization || d.specialization_name || '',
      }));

      setDoctors(doctorRows);
      setSchedules(scheduleResult.data || []);

      setDoctorId(current =>
        current || String(doctorRows[0]?.id ?? '')
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function schedulesForDay(day: string) {
    return schedules
      .filter(
        row =>
          String(row.doctor_id) === doctorId &&
          row.day_of_week === day
      )
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function openEditor(day: string) {
    const dayRows = schedulesForDay(day);

    setRanges(
      dayRows.map(row => ({
        start: String(row.start_time).slice(0, 5),
        end: String(row.end_time).slice(0, 5),
      }))
    );

    setAvailable(dayRows.length > 0);
    setEditDay(day);
  }

  function updateRange(
    index: number,
    field: keyof TimeRange,
    value: string
  ) {
    setRanges(previous =>
      previous.map((range, i) =>
        i === index ? { ...range, [field]: value } : range
      )
    );
  }

  async function saveSchedule() {
    if (!editDay || !doctorId) return;

    if (available && ranges.length === 0) {
      showToast('error', 'Missing time range', 'Add a time range or mark this day unavailable.');
      return;
    }

    const normalized = ranges.map(range => ({
      start: timeTo24(range.start),
      end: timeTo24(range.end),
    }));

    for (const range of normalized) {
      if (!range.start || !range.end || range.start >= range.end) {
        showToast('error', 'Invalid time', 'Every end time must be after its start time.');
        return;
      }
    }

    const sorted = [...normalized].sort((a, b) => a.start.localeCompare(b.start));

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        showToast('error', 'Overlapping ranges', 'Time ranges cannot overlap.');
        return;
      }
    }

    setSaving(true);

    try {
      await api(
        `/admin/doctors/${doctorId}/schedules/${editDay}`,
        {
          method: 'PUT',
          body: JSON.stringify({
  day_of_week: editDay,
  ranges: available ? normalized : [],
  is_available: available,
}),
        }
      );

      const result = await api('/admin/schedules');
      setSchedules(result.data || []);
      setEditDay(null);

      showToast(
        'success',
        'Schedule updated',
        `${selectedDoctor?.name || 'Doctor'} — ${editDay} saved successfully.`
      );
    } catch (e) {
      showToast(
        'error',
        'Save failed',
        e instanceof Error ? e.message : 'Could not save schedule'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout
      items={navItems}
      title="Admin Portal"
      headerTitle="Schedules"
      headerSubtitle="View and manage doctor schedules"
      footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-700">
          {error}{' '}
          <button className="underline" onClick={() => void loadData()}>
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 max-w-sm">
        <Select
          label="Select Doctor"
          value={doctorId}
          onChange={event => setDoctorId(event.target.value)}
          disabled={loading || doctors.length === 0}
        >
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
              {doctor.specialization ? ` — ${doctor.specialization}` : ''}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-navy-500">
              Loading schedules…
            </p>
          </CardContent>
        </Card>
      ) : !doctors.length ? (
        <Card>
          <CardContent>
            <p className="py-8 text-center text-navy-500">
              No doctors were returned by the API.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {DAYS.map(({ short, full }) => {
                const dayRows = schedulesForDay(full);

                return (
                  <div
                    key={full}
                    className="flex flex-col gap-3 rounded-xl border border-navy-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary-50 p-2 text-primary-600">
                        <Calendar className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-navy-900">
                          {short}
                        </h3>

                        {dayRows.length ? (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {dayRows.map(row => (
                              <Badge key={row.id}>
  {displayTime(row.start_time)} – {displayTime(row.end_time)}
</Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-navy-400">
                            Not available
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditor(full)}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        open={!!editDay}
        onClose={() => setEditDay(null)}
        title={`Edit ${editDay ? editDay.charAt(0).toUpperCase() + editDay.slice(1) : ''} Schedule`}
        description={`${selectedDoctor?.name || 'Doctor'} — set availability and working hours`}
        size="lg"
      >
        <div className="space-y-5 p-6">
          <label className="flex items-center justify-between rounded-xl bg-navy-50 p-4">
            <span>
              <span className="block font-medium text-navy-800">
                Available for appointments
              </span>
              <span className="text-sm text-navy-500">
                Turn off to mark this day unavailable.
              </span>
            </span>

            <input
              type="checkbox"
              checked={available}
              onChange={event => setAvailable(event.target.checked)}
            />
          </label>

          {available && (
            <>
              {ranges.map((range, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <Input
                    label="Start time"
                    type="time"
                    value={range.start}
                    onChange={event =>
                      updateRange(index, 'start', event.target.value)
                    }
                    required
                  />

                  <Input
                    label="End time"
                    type="time"
                    value={range.end}
                    onChange={event =>
                      updateRange(index, 'end', event.target.value)
                    }
                    required
                  />

                  <button
                    type="button"
                    className="mb-1 rounded-lg p-2 text-error-600 hover:bg-error-50"
                    aria-label="Remove time range"
                    onClick={() =>
                      setRanges(previous =>
                        previous.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={() =>
                  setRanges(previous => [
                    ...previous,
                    { start: '09:00', end: '17:00' },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add time range
              </Button>
            </>
          )}

          <div className="flex justify-end gap-3 border-t border-navy-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setEditDay(null)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => void saveSchedule()}
              loading={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
