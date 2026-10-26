

import { useEffect, useState } from 'react';
import {
  Search,
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  UserX,
  Plus,
  LayoutDashboard,
  Stethoscope,
  Users,
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
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useToast } from '@/context/ToastContext';
import { specializations } from '@/data/specializations';
import { formatCurrency } from '@/lib/utils';

const API_URL = 'http://localhost:5001/api';

type DoctorRecord = {
  id: number | string;
  user_id: number | string;
  name: string;
  email: string;
  specialization: string;
  qualification: string | null;
  experience_years: number;
  consultation_fee: number;
  city?: string | null;
  hospital?: string | null;
  about?: string | null;
  languages?: string[] | string | null;
};

type DoctorForm = {
  name: string;
  email: string;
  password: string;
  specialization: string;
  qualification: string;
  experience_years: string;
  consultation_fee: string;
};

const emptyForm: DoctorForm = {
  name: '',
  email: '',
  password: '',
  specialization: '',
  qualification: '',
  experience_years: '0',
  consultation_fee: '0',
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

async function apiRequest<T = any>(
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

export function AdminDoctors() {
  const { showToast } = useToast();

  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSpec, setFilterSpec] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRecord | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<DoctorRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorRecord | null>(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DoctorForm>(emptyForm);

  const loadDoctors = async () => {
    setLoading(true);

    try {
      const result = await apiRequest<{
        success: boolean;
        count: number;
        data: DoctorRecord[];
      }>('/doctors');

      setDoctors(result.data ?? []);
    } catch (error) {
      showToast(
        'error',
        'Could Not Load Doctors',
        error instanceof Error ? error.message : 'Failed to fetch doctors.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDoctors();
  }, []);

  const filtered = doctors.filter((doctor) => {
    const query = search.toLowerCase();

    return (
      (doctor.name.toLowerCase().includes(query) ||
        doctor.email.toLowerCase().includes(query)) &&
      (!filterSpec || doctor.specialization === filterSpec)
    );
  });

  const openEdit = (doctor: DoctorRecord) => {
    setEditingDoctor(doctor);

    setForm({
      ...emptyForm,
      specialization: doctor.specialization ?? '',
      qualification: doctor.qualification ?? '',
      experience_years: String(doctor.experience_years ?? 0),
      consultation_fee: String(doctor.consultation_fee ?? 0),
    });

    setOpenMenu(null);
  };

  const handleCreateDoctor = async () => {
    const experience = Number(form.experience_years);
    const fee = Number(form.consultation_fee);

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.specialization.trim()
    ) {
      showToast(
        'error',
        'Missing Details',
        'Name, email, password and specialization are required.',
      );
      return;
    }

    if (form.password.length < 8) {
      showToast(
        'error',
        'Weak Password',
        'Password must contain at least 8 characters.',
      );
      return;
    }

    if (
      !Number.isInteger(experience) ||
      experience < 0 ||
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      showToast(
        'error',
        'Invalid Details',
        'Enter valid non-negative experience and consultation fee values.',
      );
      return;
    }

    setSaving(true);

    try {
      await apiRequest('/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          specialization: form.specialization.trim(),
          qualification: form.qualification.trim() || null,
          experience_years: experience,
          consultation_fee: fee,
        }),
      });

      setShowAddModal(false);
      setForm(emptyForm);

      await loadDoctors();

      showToast(
        'success',
        'Doctor Created',
        'Doctor account and profile created successfully.',
      );
    } catch (error) {
      showToast(
        'error',
        'Creation Failed',
        error instanceof Error ? error.message : 'Could not create doctor.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingDoctor) return;

    const experience = Number(form.experience_years);
    const fee = Number(form.consultation_fee);

    if (
      !form.specialization.trim() ||
      !Number.isInteger(experience) ||
      experience < 0 ||
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      showToast(
        'error',
        'Invalid Details',
        'Check the specialization, experience and consultation fee.',
      );
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/doctors/${editingDoctor.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          specialization: form.specialization.trim(),
          qualification: form.qualification.trim() || null,
          experience_years: experience,
          consultation_fee: fee,
        }),
      });

      setEditingDoctor(null);
      await loadDoctors();

      showToast('success', 'Doctor Updated', 'Changes saved to the database.');
    } catch (error) {
      showToast(
        'error',
        'Update Failed',
        error instanceof Error ? error.message : 'Could not update doctor.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiRequest(`/doctors/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      setDeleteTarget(null);
      await loadDoctors();

      showToast('success', 'Doctor Removed', 'Doctor removed from the database.');
    } catch (error) {
      showToast(
        'error',
        'Delete Failed',
        error instanceof Error
          ? error.message
          : 'Could not remove doctor. Existing appointments may prevent deletion.',
      );
    }
  };

  return (
    <DashboardLayout
      items={navItems}
      title="Admin Portal"
      headerTitle="Manage Doctors"
      headerSubtitle={`${doctors.length} doctors registered`}
      footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          className="input sm:w-48"
          value={filterSpec}
          onChange={(event) => setFilterSpec(event.target.value)}
        >
          <option value="">All Specializations</option>
          {specializations.map((specialization) => (
            <option key={specialization.id} value={specialization.name}>
              {specialization.name}
            </option>
          ))}
        </select>

        <Button
          onClick={() => {
            setForm(emptyForm);
            setShowAddModal(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-xs text-navy-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Doctor</th>
                <th className="hidden px-4 py-3 text-left font-medium md:table-cell">
                  Specialization
                </th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                  Experience
                </th>
                <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">
                  Fee
                </th>
                <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((doctor) => (
                <tr
                  key={doctor.id}
                  className="border-b border-navy-50 hover:bg-navy-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={doctor.name} size="sm" />
                      <div>
                        <p className="font-medium text-navy-900">{doctor.name}</p>
                        <p className="text-xs text-navy-400">{doctor.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="hidden px-4 py-3 text-navy-600 md:table-cell">
                    {doctor.specialization}
                  </td>

                  <td className="hidden px-4 py-3 text-navy-600 lg:table-cell">
                    {doctor.experience_years} yrs
                  </td>

                  <td className="hidden px-4 py-3 text-navy-600 lg:table-cell">
                    {formatCurrency(Number(doctor.consultation_fee) || 0)}
                  </td>

                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge status="active" />
                  </td>

                  <td className="relative px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === String(doctor.id)
                            ? null
                            : String(doctor.id),
                        )
                      }
                      className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
                      aria-label={`Actions for ${doctor.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenu === String(doctor.id) && (
                      <div className="absolute right-4 top-full z-10 mt-1 w-44 rounded-xl border border-navy-100 bg-white py-1 text-left shadow-elevated">
                        <button
                          onClick={() => {
                            setViewingDoctor(doctor);
                            setOpenMenu(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>

                        <button
                          onClick={() => openEdit(doctor)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenu(null);
                            showToast(
                              'info',
                              'Status Not Configured',
                              'Doctor activation requires a status field and backend endpoint.',
                            );
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-navy-700 hover:bg-navy-50"
                        >
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </button>

                        <button
                          onClick={() => {
                            setDeleteTarget(doctor);
                            setOpenMenu(null);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
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
          <p className="py-8 text-center text-sm text-navy-500">
            Loading doctors from database...
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-navy-500">
            No doctors found
          </p>
        )}
      </Card>

      {/* Add Doctor Modal */}
      <Modal
        open={showAddModal}
        onClose={() => !saving && setShowAddModal(false)}
        title="Add Doctor"
        description="Create a doctor profile and login account."
        size="lg"
      >
        <div className="space-y-4 p-5">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            placeholder="Dr. John Smith"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
            placeholder="doctor@example.com"
            required
          />

          <Input
            label="Temporary Login Password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />

          <div>
            <label className="label">Specialization</label>
            <select
              className="input"
              value={form.specialization}
              onChange={(event) =>
                setForm({ ...form, specialization: event.target.value })
              }
              required
            >
              <option value="">Select specialization</option>
              {specializations.map((specialization) => (
                <option
                  key={specialization.id}
                  value={specialization.name}
                >
                  {specialization.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Qualification"
            value={form.qualification}
            onChange={(event) =>
              setForm({ ...form, qualification: event.target.value })
            }
            placeholder="MBBS, MD"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Experience (years)"
              type="number"
              min="0"
              step="1"
              value={form.experience_years}
              onChange={(event) =>
                setForm({ ...form, experience_years: event.target.value })
              }
              required
            />

            <Input
              label="Consultation Fee (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.consultation_fee}
              onChange={(event) =>
                setForm({ ...form, consultation_fee: event.target.value })
              }
              required
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-navy-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              onClick={() => void handleCreateDoctor()}
              loading={saving}
            >
              Create Doctor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        open={!!editingDoctor}
        onClose={() => !saving && setEditingDoctor(null)}
        title="Edit Doctor"
        size="lg"
      >
        <div className="space-y-4 p-5">
          {editingDoctor && (
            <div className="text-sm text-navy-600">
              Updating details for <strong>{editingDoctor.name}</strong>
            </div>
          )}

          <div>
            <label className="label">Specialization</label>
            <select
              className="input"
              value={form.specialization}
              onChange={(event) =>
                setForm({ ...form, specialization: event.target.value })
              }
            >
              <option value="">Select specialization</option>
              {specializations.map((specialization) => (
                <option key={specialization.id} value={specialization.name}>
                  {specialization.name}
                </option>
              ))}
              {form.specialization &&
                !specializations.some(
                  (item) => item.name === form.specialization,
                ) && (
                  <option value={form.specialization}>
                    {form.specialization}
                  </option>
                )}
            </select>
          </div>

          <Input
            label="Qualification"
            value={form.qualification}
            onChange={(event) =>
              setForm({ ...form, qualification: event.target.value })
            }
            placeholder="MBBS, MD"
          />

          <Input
            label="Experience (years)"
            type="number"
            min="0"
            value={form.experience_years}
            onChange={(event) =>
              setForm({ ...form, experience_years: event.target.value })
            }
          />

          <Input
            label="Consultation Fee"
            type="number"
            min="0"
            value={form.consultation_fee}
            onChange={(event) =>
              setForm({ ...form, consultation_fee: event.target.value })
            }
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingDoctor(null)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button onClick={() => void handleUpdate()} loading={saving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Doctor Profile Modal */}
      <Modal
        open={!!viewingDoctor}
        onClose={() => setViewingDoctor(null)}
        title="Doctor Profile"
        size="lg"
      >
        {viewingDoctor && (
          <div className="space-y-3 p-5 text-sm">
            <p><strong>Name:</strong> {viewingDoctor.name}</p>
            <p><strong>Email:</strong> {viewingDoctor.email}</p>
            <p><strong>Specialization:</strong> {viewingDoctor.specialization}</p>
            <p><strong>Qualification:</strong> {viewingDoctor.qualification || '—'}</p>
            <p><strong>Experience:</strong> {viewingDoctor.experience_years} years</p>
            <p>
              <strong>Consultation fee:</strong>{' '}
              {formatCurrency(Number(viewingDoctor.consultation_fee) || 0)}
            </p>
            <p><strong>City:</strong> {viewingDoctor.city || '—'}</p>
            <p><strong>Hospital:</strong> {viewingDoctor.hospital || '—'}</p>
            <p><strong>About:</strong> {viewingDoctor.about || '—'}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Remove Doctor?"
        description="Are you sure you want to remove this doctor? This action cannot be undone."
        confirmLabel="Yes, Remove"
      />
    </DashboardLayout>
  );
}
