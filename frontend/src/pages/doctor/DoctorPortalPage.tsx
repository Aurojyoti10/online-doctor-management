import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Clock,
  IndianRupee,
  User,
  Settings,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { doctorPortalApi } from '@/lib/doctorPortalApi';

type Section =
  | 'dashboard'
  | 'appointments'
  | 'patients'
  | 'availability'
  | 'profile'
  | 'earnings'
  | 'settings';

type ScheduleSlot = {
  day_of_week: string;
  slot: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const navItems = [
  { label: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
  { label: 'Patients', path: '/doctor/patients', icon: Users },
  { label: 'Availability', path: '/doctor/availability', icon: Clock },
  { label: 'Earnings', path: '/doctor/earnings', icon: IndianRupee },
  { label: 'Profile', path: '/doctor/profile', icon: User },
  { label: 'Settings', path: '/doctor/settings', icon: Settings },
];

const titles: Record<Section, string> = {
  dashboard: 'Doctor Dashboard',
  appointments: 'Appointments',
  patients: 'Patients',
  availability: 'Availability',
  profile: 'Doctor Profile',
  earnings: 'Earnings',
  settings: 'Settings',
};

const money = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const dateText = (value: unknown) => {
  if (!value) return '—';

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
};

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-navy-100 bg-white p-5">
      <h2 className="mb-4 font-semibold text-navy-900">{title}</h2>
      {children}
    </section>
  );
}

function Message({ children }: { children: ReactNode }) {
  return <p className="py-4 text-sm text-navy-500">{children}</p>;
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm text-navy-600">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-navy-900"
        type={type}
        min={type === 'number' ? 0 : undefined}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function createDefaultSchedule(): ScheduleSlot[] {
  return DAYS.flatMap((day) => [
    {
      day_of_week: day,
      slot: 1,
      start_time: '09:00',
      end_time: '12:00',
      is_available: false,
    },
    {
      day_of_week: day,
      slot: 2,
      start_time: '16:00',
      end_time: '19:00',
      is_available: false,
    },
  ]);
}

export function DoctorPortalPage({ section }: { section: Section }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('Today');

  const [prescriptionAppointment, setPrescriptionAppointment] =
    useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [instructions, setInstructions] = useState('');
  const [savingPrescription, setSavingPrescription] = useState(false);

  const [profile, setProfile] = useState<any>({});
  const [schedule, setSchedule] = useState<ScheduleSlot[]>(
    createDefaultSchedule
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let result: any;

      if (section === 'dashboard') {
        result = await doctorPortalApi('/dashboard');
        setData(result.data);
      } else if (section === 'appointments') {
        result = await doctorPortalApi('/appointments');

        const appointments = Array.isArray(result.data)
          ? result.data
          : [];

        console.log('Appointments returned by API:', appointments);
        setRows(appointments);
      } else if (section === 'patients') {
        result = await doctorPortalApi(
          id ? `/patients/${id}` : '/patients'
        );

        setData(id ? result.data : null);
        setRows(
          id
            ? result.data?.appointments || []
            : result.data || []
        );
      } else if (section === 'availability') {
        result = await doctorPortalApi('/availability');

        const saved = result.data || [];
        const defaults = createDefaultSchedule();

        setSchedule(
          defaults.map((slot) => {
            const matchingRows = saved
              .filter(
                (savedSlot: any) =>
                  savedSlot.day_of_week === slot.day_of_week &&
                  Boolean(savedSlot.is_available)
              )
              .sort((a: any, b: any) =>
                String(a.start_time).localeCompare(
                  String(b.start_time)
                )
              );

            const existing = matchingRows[slot.slot - 1];

            if (!existing) return slot;

            return {
              ...slot,
              start_time: String(existing.start_time).slice(0, 5),
              end_time: String(existing.end_time).slice(0, 5),
              is_available: true,
            };
          })
        );
      } else if (section === 'profile') {
        result = await doctorPortalApi('/profile');
        setProfile(result.data || {});
      } else if (section === 'earnings') {
        result = await doctorPortalApi('/earnings');
        setData(result.data);
        setRows(result.data?.payments || []);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load data.'
      );
    } finally {
      setLoading(false);
    }
  }, [section, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!prescriptionAppointment) return;

    requestAnimationFrame(() => {
      document
        .getElementById('prescription-form')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
    });
  }, [prescriptionAppointment]);
    async function updateStatus(
    appointmentId: number,
    status: string
  ) {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const result = await doctorPortalApi(
        `/appointments/${appointmentId}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }
      );

      setNotice(result.message || 'Appointment updated.');
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Appointment update failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  function clearPrescriptionForm() {
    setPrescriptionAppointment(null);
    setDiagnosis('');
    setMedications('');
    setInstructions('');
  }

  async function savePrescriptionAndComplete() {
    if (!prescriptionAppointment) return;

    if (!diagnosis.trim() || !medications.trim()) {
      setError(
        'Please enter both the diagnosis and medications.'
      );
      setNotice('');
      return;
    }

    setSavingPrescription(true);
    setError('');
    setNotice('');

    let prescriptionSaved = false;

    try {
      const stored = localStorage.getItem('careconnect_auth');

      if (!stored) {
        throw new Error('Please log in again.');
      }

      let auth: any;

      try {
        auth = JSON.parse(stored);
      } catch {
        throw new Error(
          'Invalid login session. Please log in again.'
        );
      }

      if (!auth.token) {
        throw new Error(
          'Session token missing. Please log in again.'
        );
      }

      const result = await fetch(
        'http://localhost:5001/api/prescriptions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            appointment_id: prescriptionAppointment.id,
            diagnosis: diagnosis.trim(),
            medications: medications.trim(),
            instructions: instructions.trim(),
          }),
        }
      );

      const prescriptionResult = await result
        .json()
        .catch(() => ({}));

      if (
        !result.ok ||
        prescriptionResult.success === false
      ) {
        throw new Error(
          prescriptionResult.message ||
            `Prescription request failed (${result.status}).`
        );
      }

      prescriptionSaved = true;

      await doctorPortalApi(
        `/appointments/${prescriptionAppointment.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' }),
        }
      );

      clearPrescriptionForm();

      setNotice(
        prescriptionResult.message ||
          'Prescription saved and appointment completed.'
      );

      await load();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Unable to save the prescription.';

      setError(
        prescriptionSaved
          ? `The prescription was saved, but the appointment could not be completed. Please refresh and check its status. ${message}`
          : message
      );
    } finally {
      setSavingPrescription(false);
    }
  }

  async function saveProfile() {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const result = await doctorPortalApi('/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      });

      setNotice(result.message || 'Profile saved.');
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Profile update failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  function updateScheduleSlot(
    day: string,
    slotNumber: number,
    changes: Partial<ScheduleSlot>
  ) {
    setSchedule((current) =>
      current.map((slot) =>
        slot.day_of_week === day &&
        slot.slot === slotNumber
          ? { ...slot, ...changes }
          : slot
      )
    );
  }

  async function saveSchedule() {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const enabled = schedule.filter(
        (slot) => slot.is_available
      );

      for (const slot of enabled) {
        if (!slot.start_time || !slot.end_time) {
          throw new Error(
            `Enter both times for ${slot.day_of_week}, range ${slot.slot}.`
          );
        }

        if (slot.start_time >= slot.end_time) {
          throw new Error(
            `End time must be later than start time for ${slot.day_of_week}, range ${slot.slot}.`
          );
        }
      }

      for (const day of DAYS) {
        const daySlots = enabled
          .filter((slot) => slot.day_of_week === day)
          .sort((a, b) =>
            a.start_time.localeCompare(b.start_time)
          );

        if (
          daySlots.length === 2 &&
          daySlots[1].start_time < daySlots[0].end_time
        ) {
          throw new Error(
            `The two time ranges overlap on ${day}.`
          );
        }
      }

      const result = await doctorPortalApi('/availability', {
        method: 'PUT',
        body: JSON.stringify({
          schedule: enabled.map((slot) => ({
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: true,
          })),
        }),
      });

      setNotice(result.message || 'Availability saved.');
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Schedule update failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  const heading = titles[section];

  const now = new Date();

  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const getAppointmentDate = (
    appointment: any
  ): string => {
    const value =
      appointment.appointment_date ??
      appointment.date ??
      appointment.appointmentDate ??
      '';

    return String(value).slice(0, 10);
  };

  const visibleAppointments = rows.filter(
    (appointment) => {
      const date = getAppointmentDate(appointment);
      const status = String(
        appointment.status || ''
      ).toLowerCase();

      if (section !== 'appointments') return true;

      if (tab === 'Today') return date === today;

      if (tab === 'Upcoming') {
        return (
          date > today &&
          ['scheduled', 'confirmed'].includes(status)
        );
      }

      if (tab === 'Pending') {
        return status === 'scheduled';
      }

      if (tab === 'Completed') {
        return status === 'completed';
      }

      return true;
    }
  );

  return (
    <DashboardLayout
      items={navItems}
      title="Doctor Portal"
      headerTitle={heading}
      headerSubtitle={`Welcome${user?.name ? `, ${user.name}` : ''}`}
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut,
      }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-navy-500">
            Data is loaded from your authenticated doctor account.
          </p>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {notice}
          </div>
        )}

        {loading && (
          <Message>Loading your data…</Message>
        )}
                {!loading && section === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                [
                  'Today’s appointments',
                  data?.stats?.today_appointments ?? 0,
                ],
                [
                  'Scheduled',
                  data?.stats?.scheduled_appointments ?? 0,
                ],
                [
                  'Total patients',
                  data?.stats?.total_patients ?? 0,
                ],
                [
                  'Today’s recorded payments',
                  money(data?.stats?.today_earnings),
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-navy-100 bg-white p-4"
                >
                  <p className="text-sm text-navy-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-navy-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Card title="Today's schedule">
              {data?.today?.length ? (
                <div className="divide-y divide-navy-100">
                  {data.today.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {appointment.patient_name}
                        </p>
                        <p className="text-sm text-navy-500">
                          {String(
                            appointment.start_time || ''
                          ).slice(0, 5)}
                          {' · '}
                          {appointment.reason || 'Consultation'}
                        </p>
                      </div>

                      <span className="text-sm capitalize">
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Message>
                  No appointments scheduled for today.
                </Message>
              )}
            </Card>

            <Card title="Recorded revenue — last seven days">
              {data?.weekly_revenue?.length ? (
                <div className="space-y-2">
                  {data.weekly_revenue.map(
                    (revenue: any) => (
                      <div
                        key={String(revenue.day)}
                        className="flex justify-between border-b border-navy-50 py-2"
                      >
                        <span>{dateText(revenue.day)}</span>
                        <strong>{money(revenue.revenue)}</strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <Message>
                  No completed payments recorded this week.
                </Message>
              )}
            </Card>
          </>
        )}

        {!loading && section === 'appointments' && (
          <>
            <Card title="Your appointments">
              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  'Today',
                  'Upcoming',
                  'Pending',
                  'Completed',
                  'All',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTab(item)}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      tab === item
                        ? 'bg-primary-600 text-white'
                        : 'border border-navy-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {visibleAppointments.length ? (
                <div className="space-y-3">
                  {visibleAppointments.map(
                    (appointment: any) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border border-navy-100 p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <p className="font-semibold">
                              {appointment.patient_name ||
                                appointment.patient_name_full ||
                                'Patient'}
                            </p>

                            <p className="text-sm text-navy-500">
                              {dateText(
                                getAppointmentDate(appointment)
                              )}
                              {' · '}
                              {String(
                                appointment.start_time || ''
                              ).slice(0, 5)}
                              {'–'}
                              {String(
                                appointment.end_time || ''
                              ).slice(0, 5)}
                            </p>

                            <p className="mt-1 text-sm">
                              {appointment.reason ||
                                'No reason provided'}
                            </p>

                            <p className="mt-1 text-xs capitalize text-navy-500">
                              Status: {appointment.status}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-start gap-2">
                            <button
                              type="button"
                              className="rounded-lg border px-3 py-2 text-sm"
                              onClick={() =>
                                navigate(
                                  `/doctor/patients/${appointment.patient_id}`
                                )
                              }
                            >
                              View patient
                            </button>

                            {appointment.status === 'scheduled' && (
                              <>
                                <ActionButton
                                  disabled={busy}
                                  onClick={() =>
                                    void updateStatus(
                                      appointment.id,
                                      'confirmed'
                                    )
                                  }
                                >
                                  Confirm
                                </ActionButton>

                                <button
                                  type="button"
                                  disabled={busy}
                                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                                  onClick={() =>
                                    void updateStatus(
                                      appointment.id,
                                      'cancelled'
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {appointment.status === 'confirmed' && (
                              <ActionButton
                                disabled={
                                  busy || savingPrescription
                                }
                                onClick={() => {
                                  setError('');
                                  setNotice('');
                                  setDiagnosis('');
                                  setMedications('');
                                  setInstructions('');
                                  setPrescriptionAppointment(
                                    appointment
                                  );
                                }}
                              >
                                Write prescription
                              </ActionButton>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <Message>
                  {tab === 'Today'
                    ? `No appointments were found for ${dateText(today)}. Try All to check whether appointments exist under another date.`
                    : 'No appointments in this category.'}
                </Message>
              )}
            </Card>

            {prescriptionAppointment && (
              <div
                id="prescription-form"
                className="scroll-mt-6"
              >
                <Card title="Write prescription">
                  <div className="mb-4 rounded-lg bg-navy-50 p-3">
                    <p className="font-medium">
                      Patient:{' '}
                      {prescriptionAppointment.patient_name ||
                        'Patient'}
                    </p>

                    <p className="mt-1 text-sm text-navy-600">
                      Appointment date:{' '}
                      {dateText(
                        getAppointmentDate(
                          prescriptionAppointment
                        )
                      )}
                    </p>

                    <p className="mt-1 text-sm text-navy-600">
                      Reason:{' '}
                      {prescriptionAppointment.reason ||
                        'Consultation'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-navy-700">
                      Diagnosis *
                      <textarea
                        rows={3}
                        value={diagnosis}
                        onChange={(event) =>
                          setDiagnosis(event.target.value)
                        }
                        placeholder="Enter diagnosis"
                        className="mt-1 w-full rounded-lg border border-navy-200 p-3 font-normal"
                      />
                    </label>

                    <label className="block text-sm font-medium text-navy-700">
                      Medications *
                      <textarea
                        rows={5}
                        value={medications}
                        onChange={(event) =>
                          setMedications(event.target.value)
                        }
                        placeholder="Enter medication, dosage and frequency"
                        className="mt-1 w-full rounded-lg border border-navy-200 p-3 font-normal"
                      />
                    </label>

                    <label className="block text-sm font-medium text-navy-700">
                      Instructions (optional)
                      <textarea
                        rows={3}
                        value={instructions}
                        onChange={(event) =>
                          setInstructions(event.target.value)
                        }
                        placeholder="Follow-up advice and instructions"
                        className="mt-1 w-full rounded-lg border border-navy-200 p-3 font-normal"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        disabled={savingPrescription}
                        onClick={() =>
                          void savePrescriptionAndComplete()
                        }
                      >
                        {savingPrescription
                          ? 'Saving…'
                          : 'Save prescription and complete appointment'}
                      </ActionButton>

                      <button
                        type="button"
                        disabled={savingPrescription}
                        onClick={clearPrescriptionForm}
                        className="rounded-lg border border-navy-200 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
                {!loading && section === 'patients' && (
          <Card
            title={
              data
                ? `Patient: ${data.name}`
                : 'Patients seen in your practice'
            }
          >
            {data ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <p>
                    <strong>Email:</strong> {data.email || '—'}
                  </p>
                  <p>
                    <strong>Phone:</strong> {data.phone || '—'}
                  </p>
                  <p>
                    <strong>Date of birth:</strong>{' '}
                    {dateText(data.date_of_birth)}
                  </p>
                  <p>
                    <strong>Gender:</strong> {data.gender || '—'}
                  </p>
                  <p>
                    <strong>Address:</strong> {data.address || '—'}
                  </p>
                </div>

                <h3 className="mt-6 font-semibold">
                  Appointment history
                </h3>

                {rows.length ? (
                  rows.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      className="flex flex-wrap justify-between gap-2 border-b py-3 text-sm"
                    >
                      <span>
                        {dateText(
                          getAppointmentDate(appointment)
                        )}
                        {' · '}
                        {String(
                          appointment.start_time || ''
                        ).slice(0, 5)}
                      </span>

                      <span className="capitalize">
                        {appointment.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <Message>No appointment history.</Message>
                )}
              </>
            ) : rows.length ? (
              <div className="space-y-2">
                {rows.map((patient: any) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/doctor/patients/${patient.id}`
                      )
                    }
                    className="flex w-full flex-wrap justify-between gap-2 rounded-lg border border-navy-100 p-4 text-left hover:bg-navy-50"
                  >
                    <span>
                      <strong className="block">
                        {patient.name}
                      </strong>
                      <span className="text-sm text-navy-500">
                        {patient.email}
                      </span>
                    </span>

                    <span className="text-sm text-navy-500">
                      {patient.appointments_count} appointments
                      {' · Last: '}
                      {dateText(patient.last_appointment)}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <Message>
                No patients found for your appointments.
              </Message>
            )}
          </Card>
        )}

        {!loading && section === 'availability' && (
          <Card title="Weekly availability">
            <p className="mb-4 text-sm text-navy-500">
              Configure up to two available time ranges per day.
            </p>

            <div className="space-y-5">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="rounded-lg border border-navy-100 p-4"
                >
                  <h3 className="mb-3 font-semibold capitalize text-navy-900">
                    {day}
                  </h3>

                  <div className="space-y-4">
                    {[1, 2].map((slotNumber) => {
                      const entry = schedule.find(
                        (slot) =>
                          slot.day_of_week === day &&
                          slot.slot === slotNumber
                      );

                      if (!entry) return null;

                      return (
                        <div
                          key={`${day}-${slotNumber}`}
                          className="grid items-center gap-3 sm:grid-cols-[140px_1fr_1fr]"
                        >
                          <label className="flex items-center gap-2 text-sm text-navy-700">
                            <input
                              type="checkbox"
                              checked={entry.is_available}
                              onChange={(event) =>
                                updateScheduleSlot(
                                  day,
                                  slotNumber,
                                  {
                                    is_available:
                                      event.target.checked,
                                  }
                                )
                              }
                            />
                            Time range {slotNumber}
                          </label>

                          <label className="text-sm text-navy-600">
                            Start time
                            <input
                              type="time"
                              disabled={!entry.is_available}
                              value={entry.start_time}
                              onChange={(event) =>
                                updateScheduleSlot(
                                  day,
                                  slotNumber,
                                  {
                                    start_time:
                                      event.target.value,
                                  }
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-navy-200 p-2 disabled:opacity-40"
                            />
                          </label>

                          <label className="text-sm text-navy-600">
                            End time
                            <input
                              type="time"
                              disabled={!entry.is_available}
                              value={entry.end_time}
                              onChange={(event) =>
                                updateScheduleSlot(
                                  day,
                                  slotNumber,
                                  {
                                    end_time:
                                      event.target.value,
                                  }
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-navy-200 p-2 disabled:opacity-40"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <ActionButton
                disabled={busy}
                onClick={() => void saveSchedule()}
              >
                {busy ? 'Saving…' : 'Save availability'}
              </ActionButton>
            </div>
          </Card>
        )}

        {!loading && section === 'profile' && (
          <Card title="Your professional profile">
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                ['name', 'Full name', 'text'],
                ['specialization', 'Specialization', 'text'],
                ['qualification', 'Qualifications', 'text'],
                ['experience_years', 'Years of experience', 'number'],
                ['consultation_fee', 'Consultation fee (₹)', 'number'],
                ['city', 'City', 'text'],
                ['hospital', 'Hospital / clinic', 'text'],
                ['languages', 'Languages', 'text'],
              ] as const).map(([key, label, type]) => (
                <Field
                  key={key}
                  label={label}
                  type={type}
                  value={profile[key] ?? ''}
                  onChange={(value) =>
                    setProfile((current: any) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                />
              ))}

              <label className="block text-sm text-navy-600 sm:col-span-2">
                About
                <textarea
                  rows={4}
                  value={profile.about ?? ''}
                  onChange={(event) =>
                    setProfile((current: any) => ({
                      ...current,
                      about: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-navy-200 p-3"
                />
              </label>

              <p className="text-sm text-navy-500 sm:col-span-2">
                Email: {profile.email || '—'} (managed by account
                administration)
              </p>
            </div>

            <div className="mt-5">
              <ActionButton
                disabled={busy}
                onClick={() => void saveProfile()}
              >
                {busy ? 'Saving…' : 'Save profile'}
              </ActionButton>
            </div>
          </Card>
        )}

        {!loading && section === 'earnings' && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                [
                  'Recorded revenue',
                  money(data?.summary?.total_revenue),
                ],
                [
                  'Completed payments',
                  data?.summary?.completed_payments ?? 0,
                ],
                [
                  'Pending payments',
                  data?.summary?.pending_payments ?? 0,
                ],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border bg-white p-4"
                >
                  <p className="text-sm text-navy-500">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Card title="Payment history">
              {rows.length ? (
                <div className="space-y-2">
                  {rows.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex flex-wrap justify-between gap-2 border-b py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {payment.patient_name}
                        </p>
                        <p className="text-sm text-navy-500">
                          {dateText(payment.appointment_date)}
                          {' · '}
                          {payment.payment_method}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">
                          {money(payment.amount)}
                        </p>
                        <p className="text-sm capitalize text-navy-500">
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Message>No payment records found.</Message>
              )}

              <p className="mt-4 text-xs text-navy-500">
                These figures reflect database payment records,
                not verified payouts.
              </p>
            </Card>
          </>
        )}

        {!loading && section === 'settings' && (
          <Card title="Account">
            <p className="text-sm text-navy-600">
              Signed in as {user?.email || 'doctor'}.
            </p>

            <p className="mt-2 text-sm text-navy-500">
              Doctor accounts are created by an administrator.
            </p>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-700"
            >
              Log out
            </button>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}