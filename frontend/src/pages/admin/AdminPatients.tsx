
import { useEffect, useState } from 'react';
import {
  Search,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Ban,
  Users,
  LayoutDashboard,
  Stethoscope,
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { EmptyState } from '@/components/ui/States';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

const API_URL = 'http://localhost:5001/api';

type PatientRecord = {
  id: number | string;
  user_id: number | string;
  name: string;
  email: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  appointments_count: number;
};

type PatientForm = {
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
};

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

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const stored = localStorage.getItem('careconnect_auth');

  if (!stored) {
    throw new Error('Please log in again.');
  }

  let token: string | null;

  try {
    token = JSON.parse(stored).token ?? null;
  } catch {
    throw new Error('Your login session is invalid. Please log in again.');
  }

  if (!token) {
    throw new Error('Your session token is missing. Please log in again.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed (${response.status})`);
  }

  return result as T;
}

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return '—';

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) return '—';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  const birthdayNotReached =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() &&
      today.getDate() < dob.getDate());

  if (birthdayNotReached) age--;

  return age >= 0 ? String(age) : '—';
}

function dateInputValue(value: string | null): string {
  if (!value) return '';

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function AdminPatients() {
  const { showToast } = useToast();

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatientRecord | null>(null);
  const [viewingPatient, setViewingPatient] = useState<PatientRecord | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<PatientForm>({
    date_of_birth: '',
    gender: '',
    phone: '',
    address: '',
  });

  const loadPatients = async () => {
    setLoading(true);

    try {
      const result = await apiRequest<{
        success: boolean;
        count: number;
        data: PatientRecord[];
      }>('/patients');

      setPatients(result.data ?? []);
    } catch (error) {
      showToast(
        'error',
        'Could Not Load Patients',
        error instanceof Error ? error.message : 'Failed to fetch patients.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, []);

  const filtered = patients.filter((patient) => {
    const query = search.toLowerCase();

    return (
      patient.name.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query)
    );
  });

  const openEdit = (patient: PatientRecord) => {
    setEditingPatient(patient);

    setForm({
      date_of_birth: dateInputValue(patient.date_of_birth),
      gender: patient.gender ?? '',
      phone: patient.phone ?? '',
      address: patient.address ?? '',
    });

    setOpenMenu(null);
  };

  const handleUpdate = async () => {
    if (!editingPatient) return;

    if (
      form.gender &&
      !['male', 'female', 'other'].includes(form.gender.toLowerCase())
    ) {
      showToast('error', 'Invalid Gender', 'Please select a valid gender.');
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/patients/${editingPatient.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        }),
      });

      setEditingPatient(null);
      await loadPatients();

      showToast(
        'success',
        'Patient Updated',
        'Patient details saved to the database.',
      );
    } catch (error) {
      showToast(
        'error',
        'Update Failed',
        error instanceof Error ? error.message : 'Could not update patient.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiRequest(`/patients/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      setDeleteTarget(null);
      await loadPatients();

      showToast(
        'success',
        'Patient Deleted',
        'Patient profile deleted from the database.',
      );
    } catch (error) {
      showToast(
        'error',
        'Delete Failed',
        error instanceof Error
          ? error.message
          : 'Could not delete the patient. Existing appointments may prevent deletion.',
      );
    }
  };

  return (
    <DashboardLayout
      items={navItems}
      title="Admin Portal"
      headerTitle="Manage Patients"
      headerSubtitle={`${patients.length} patients registered`}
      footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-xs text-navy-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                  Age/Gender
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  Appointments
                </th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                  Registered
                </th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((patient) => (
                <tr
                  key={patient.id}
                  className="border-b border-navy-50 hover:bg-navy-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={patient.name} size="sm" />
                      <div>
                        <p className="font-medium text-navy-900">
                          {patient.name}
                        </p>
                        <p className="text-xs text-navy-400">
                          {patient.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-navy-600 hidden md:table-cell">
                    {calculateAge(patient.date_of_birth)} / {patient.gender || '—'}
                  </td>

                  <td className="px-4 py-3 text-navy-600 hidden lg:table-cell">
                    {patient.appointments_count ?? 0}
                  </td>

                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status="active" />
                  </td>

                  <td className="px-4 py-3 text-navy-500 text-xs hidden lg:table-cell">
                    {patient.created_at ? formatDate(patient.created_at) : '—'}
                  </td>

                  <td className="px-4 py-3 text-right relative">
                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === String(patient.id)
                            ? null
                            : String(patient.id),
                        )
                      }
                      className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenu === String(patient.id) && (
                      <div className="absolute right-4 top-full mt-1 w-40 bg-white rounded-xl shadow-elevated border border-navy-100 py-1 z-10 text-left">
                        <button
                          onClick={() => {
                            setViewingPatient(patient);
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>

                        <button
                          onClick={() => openEdit(patient)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            showToast(
                              'info',
                              'Suspension Not Configured',
                              'The database needs a patient status field and corresponding backend logic before suspension can be saved.',
                            );
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                        >
                          <Ban className="w-4 h-4" /> Suspend
                        </button>

                        <button
                          onClick={() => {
                            setDeleteTarget(patient);
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <p className="text-center text-sm text-navy-500 py-8">
            Loading patients from database...
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Users}
            title="No patients found"
            description="No patients match your search."
          />
        )}
      </Card>

      <Modal
        open={!!viewingPatient}
        onClose={() => setViewingPatient(null)}
        title="Patient Profile"
        size="lg"
      >
        {viewingPatient && (
          <div className="p-5 space-y-3 text-sm">
            <p><strong>Name:</strong> {viewingPatient.name}</p>
            <p><strong>Email:</strong> {viewingPatient.email}</p>
            <p><strong>Phone:</strong> {viewingPatient.phone || '—'}</p>
            <p><strong>Date of birth:</strong> {viewingPatient.date_of_birth ? formatDate(viewingPatient.date_of_birth) : '—'}</p>
            <p><strong>Age:</strong> {calculateAge(viewingPatient.date_of_birth)}</p>
            <p><strong>Gender:</strong> {viewingPatient.gender || '—'}</p>
            <p><strong>Address:</strong> {viewingPatient.address || '—'}</p>
            <p><strong>Appointments:</strong> {viewingPatient.appointments_count ?? 0}</p>
            <p><strong>Registered:</strong> {viewingPatient.created_at ? formatDate(viewingPatient.created_at) : '—'}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={!!editingPatient}
        onClose={() => setEditingPatient(null)}
        title="Edit Patient"
        size="lg"
      >
        <div className="p-5 space-y-4">
          {editingPatient && (
            <p className="text-sm text-navy-600">
              Updating details for <strong>{editingPatient.name}</strong>
            </p>
          )}

          <Input
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={(event) =>
              setForm({ ...form, date_of_birth: event.target.value })
            }
          />

          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={form.gender}
              onChange={(event) =>
                setForm({ ...form, gender: event.target.value })
              }
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
            placeholder="Phone number"
          />

          <div>
            <label className="label">Address</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.address}
              onChange={(event) =>
                setForm({ ...form, address: event.target.value })
              }
              placeholder="Patient address"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingPatient(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Patient?"
        description="Are you sure you want to permanently delete this patient? This action cannot be undone."
        confirmLabel="Yes, Delete"
      />
    </DashboardLayout>
  );
}
