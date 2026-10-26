
import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Search,
  CalendarDays,
  FileText,
  User,
  Settings,
  LogOut,
  Save,
  Pencil,
  X,
  RefreshCw,
} from 'lucide-react';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

const API_URL = 'http://localhost:5001/api';

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
  { label: 'Profile', path: '/patient/profile', icon: User },
  { label: 'Settings', path: '/patient/settings', icon: Settings },
];

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
};

const emptyProfile: ProfileData = {
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  address: '',
  city: '',
};

type ApiResult = {
  success?: boolean;
  message?: string;
  data?: any;
};

async function profileRequest(
  token: string,
  path: string,
  options: RequestInit = {}
): Promise<ApiResult> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result: ApiResult = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Request failed with status ${response.status}.`
    );
  }

  return result;
}

function getProfileData(data: any, fallbackEmail = ''): ProfileData {
  const patient = data?.patient ?? data?.profile ?? data?.user ?? data ?? {};

  return {
    name: patient.name ?? patient.full_name ?? '',
    email: patient.email ?? fallbackEmail,
    phone: patient.phone ?? '',
    date_of_birth: String(
      patient.date_of_birth ?? patient.dateOfBirth ?? ''
    ).slice(0, 10),
    gender: String(patient.gender ?? '').toLowerCase(),
    address: patient.address ?? '',
    city: patient.city ?? '',
  };
}

export function PatientProfile() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ProfileData>({
    ...emptyProfile,
    name: user?.name ?? '',
    email: user?.email ?? '',
  });

  const [originalProfile, setOriginalProfile] =
    useState<ProfileData>(profile);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    const stored = localStorage.getItem('careconnect_auth');

    if (!stored) {
      setError('Your login session was not found. Please log in again.');
      setLoading(false);
      return;
    }

    let token: string | null = null;

    try {
      token = JSON.parse(stored).token ?? null;
    } catch {
      setError('Your login session is invalid. Please log in again.');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Your login session has expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // These endpoints must be registered in the backend.
      const result = await profileRequest(token, '/patients/me');
      const loaded = getProfileData(result.data, user?.email ?? '');

      setProfile(loaded);
      setOriginalProfile(loaded);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load your profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function updateField<K extends keyof ProfileData>(
    field: K,
    value: ProfileData[K]
  ) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function cancelEditing() {
    setProfile(originalProfile);
    setEditing(false);
    setError('');
  }

  async function saveProfile() {
    const stored = localStorage.getItem('careconnect_auth');

    if (!stored) {
      showToast('error', 'Session expired', 'Please log in again.');
      return;
    }

    let token: string | null = null;

    try {
      token = JSON.parse(stored).token ?? null;
    } catch {
      showToast('error', 'Invalid session', 'Please log in again.');
      return;
    }

    if (!token) {
      showToast('error', 'Session expired', 'Please log in again.');
      return;
    }

    if (!profile.name.trim()) {
      showToast('error', 'Name required', 'Enter your full name.');
      return;
    }

    if (
      !profile.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())
    ) {
      showToast('error', 'Invalid email', 'Enter a valid email address.');
      return;
    }

    if (profile.phone && !/^[+\d\s()-]{7,20}$/.test(profile.phone.trim())) {
      showToast('error', 'Invalid phone', 'Enter a valid phone number.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        address: profile.address.trim(),
        city: profile.city.trim(),
      };

      const result = await profileRequest(token, '/patients/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const updated = getProfileData(
        result.data ?? payload,
        payload.email
      );

      setProfile(updated);
      setOriginalProfile(updated);
      setEditing(false);

      showToast(
        'success',
        'Profile updated',
        'Your profile was saved successfully.'
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to save your profile.';

      setError(message);
      showToast('error', 'Save failed', message);
    } finally {
      setSaving(false);
    }
  }

  const memberInitial = profile.name || user?.name || 'Patient';

  return (
    <DashboardLayout
      items={navItems}
      title="Patient Portal"
      headerTitle="My Profile"
      headerSubtitle="Manage your personal information"
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut,
        onClick: logout,
      } as any}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>
            {!editing && (
              <button
                type="button"
                className="mt-2 font-semibold underline"
                onClick={() => void loadProfile()}
              >
                Retry loading profile
              </button>
            )}
          </div>
        )}

        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar name={memberInitial} size="lg" />

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-xl font-bold text-navy-900">
                {profile.name || 'Patient'}
              </h2>
              <p className="break-words text-sm text-navy-500">
                {profile.email || user?.email || 'No email available'}
              </p>
              <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Patient Account
              </span>
            </div>

            {!editing && (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                disabled={loading}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-navy-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading your profile...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  value={profile.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  disabled={!editing || saving}
                />

                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  disabled={!editing || saving}
                />

                <Input
                  label="Phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  disabled={!editing || saving}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(event) =>
                    updateField('date_of_birth', event.target.value)
                  }
                  disabled={!editing || saving}
                />

                <div>
                  <label
                    htmlFor="patient-gender"
                    className="label mb-1 block"
                  >
                    Gender
                  </label>
                  <select
                    id="patient-gender"
                    className="input w-full"
                    value={profile.gender}
                    onChange={(event) =>
                      updateField('gender', event.target.value)
                    }
                    disabled={!editing || saving}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <Input
                  label="City"
                  value={profile.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  disabled={!editing || saving}
                />

                <div className="sm:col-span-2">
                  <Input
                    label="Address"
                    value={profile.address}
                    onChange={(event) =>
                      updateField('address', event.target.value)
                    }
                    disabled={!editing || saving}
                  />
                </div>
              </div>
            )}

            {editing && !loading && (
              <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>

                <Button onClick={() => void saveProfile()} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-navy-100 bg-white p-4 text-sm text-navy-500">
          Your profile information helps your healthcare providers manage your
          appointments. Only enter information that is accurate.
        </div>
      </div>
    </DashboardLayout>
  );
}
