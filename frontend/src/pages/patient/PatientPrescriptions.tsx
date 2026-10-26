
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  Stethoscope,
  Pill,
  Download,
  Printer,
  Share2,
  LayoutDashboard,
  Search,
  CalendarDays,
  User,
  Settings,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const API_URL = 'http://localhost:5001/api';

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
  { label: 'Profile', path: '/patient/profile', icon: User },
  { label: 'Settings', path: '/patient/settings', icon: Settings },
];

type Medicine = {
  name: string;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

type Prescription = {
  id: number | string;
  appointment_id?: number | string;
  diagnosis?: string | null;
  medications?: string | null;
  instructions?: string | null;
  appointment_date?: string | null;
  start_time?: string | null;
  doctor_name?: string | null;
  specialization?: string | null;
  doctorName?: string;
  date?: string;
  vitals?: Record<string, string | number>;
  symptoms?: string[];
  medicines?: Medicine[];
  advice?: string;
  followUpDate?: string;
};

async function fetchPrescriptions(token: string): Promise<Prescription[]> {
  const response = await fetch(`${API_URL}/prescriptions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || `Failed to load prescriptions (${response.status}).`
    );
  }

  if (Array.isArray(result.data)) {
    return result.data as Prescription[];
  }

  if (Array.isArray(result.data?.prescriptions)) {
    return result.data.prescriptions as Prescription[];
  }

  return [];
}

function PrescriptionLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      items={navItems}
      title="Patient Portal"
      headerTitle="My Prescriptions"
      headerSubtitle="Your prescriptions from completed consultations"
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut,
      }}
    >
      {children}
    </DashboardLayout>
  );
}

export function PatientPrescriptions() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPrescriptions() {
      if (!token) {
        setError('Please log in again to view your prescriptions.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await fetchPrescriptions(token);

        if (active) {
          setPrescriptions(data);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load prescriptions.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPrescriptions();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <PrescriptionLayout>
      {loading ? (
        <Card className="p-6">
          <p className="text-sm text-navy-500">
            Loading prescriptions...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-error-600">{error}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Card>
      ) : prescriptions.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No prescriptions yet"
            description="Prescriptions issued by your doctor will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="overflow-hidden">
              <div className="flex flex-col items-start justify-between gap-3 border-b border-navy-50 p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <Stethoscope className="h-6 w-6 text-primary-600" />
                  </div>

                  <div>
                    <p className="font-semibold text-navy-900">
                      {prescription.doctor_name ||
                        prescription.doctorName ||
                        'Treating doctor'}
                    </p>

                    <p className="text-xs text-navy-500">
                      {prescription.appointment_date
                        ? formatDate(
                            prescription.appointment_date.slice(0, 10)
                          )
                        : prescription.date
                          ? formatDate(prescription.date)
                          : 'Date unavailable'}
                      {prescription.specialization
                        ? ` · ${prescription.specialization}`
                        : ''}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/patient/prescriptions/${prescription.id}`)
                  }
                >
                  View details
                </Button>
              </div>

              <CardContent className="space-y-3 p-4">
                <div>
                  <p className="text-xs text-navy-400">Diagnosis</p>
                  <p className="font-medium text-navy-700">
                    {prescription.diagnosis || 'Not specified'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-navy-400">Medications</p>
                  <p className="whitespace-pre-wrap text-sm text-navy-700">
                    {prescription.medications ||
                      prescription.medicines
                        ?.map((medicine) => medicine.name)
                        .join('\n') ||
                      'No medication details provided.'}
                  </p>
                </div>

                {prescription.instructions && (
                  <div>
                    <p className="text-xs text-navy-400">Instructions</p>
                    <p className="whitespace-pre-wrap text-sm text-navy-700">
                      {prescription.instructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PrescriptionLayout>
  );
}

export function PrescriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPrescription() {
      if (!token || !id) {
        setError('Please log in again to view this prescription.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const data = await fetchPrescriptions(token);
        const found = data.find((item) => String(item.id) === id);

        if (!found) {
          throw new Error(
            'Prescription not found, or you do not have access to it.'
          );
        }

        if (active) {
          setPrescription(found);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load this prescription.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPrescription();

    return () => {
      active = false;
    };
  }, [id, token]);

  if (loading || error || !prescription) {
    return (
      <DashboardLayout
        items={navItems}
        title="Patient Portal"
        headerTitle="Prescription Details"
        footerItem={{
          label: 'Logout',
          path: '/login',
          icon: LogOut,
        }}
      >
        <Card className="p-6">
          {loading ? (
            <p className="text-sm text-navy-500">
              Loading prescription...
            </p>
          ) : (
            <>
              <p className="text-sm text-error-600">
                {error || 'Prescription not found.'}
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/patient/prescriptions')}
              >
                Back to prescriptions
              </Button>
            </>
          )}
        </Card>
      </DashboardLayout>
    );
  }

  const doctorName =
    prescription.doctor_name ||
    prescription.doctorName ||
    'Treating doctor';

  const date = prescription.appointment_date || prescription.date;

  const medicines: Medicine[] = prescription.medicines?.length
    ? prescription.medicines
    : (prescription.medications || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => ({ name: line }));

  function downloadDetails() {
    const currentPrescription = prescription;

    if (!currentPrescription) {
      showToast(
        'error',
        'Download failed',
        'Prescription details are unavailable.'
      );
      return;
    }

    const currentDoctorName =
      currentPrescription.doctor_name ||
      currentPrescription.doctorName ||
      'Treating doctor';

    const currentDate =
      currentPrescription.appointment_date ||
      currentPrescription.date ||
      'Unavailable';

    const currentMedicines: Medicine[] =
      currentPrescription.medicines?.length
        ? currentPrescription.medicines
        : (currentPrescription.medications || '')
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => ({ name: line }));

    const content = [
      `CareConnect Prescription #${currentPrescription.id}`,
      `Doctor: ${currentDoctorName}`,
      `Date: ${currentDate}`,
      `Diagnosis: ${currentPrescription.diagnosis || 'Not specified'}`,
      `Medications: ${
        currentPrescription.medications ||
        currentMedicines.map((medicine) => medicine.name).join(', ') ||
        'None specified'
      }`,
      `Instructions: ${currentPrescription.instructions || 'None provided'}`,
    ].join('\n');

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `prescription-${currentPrescription.id}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);

    showToast(
      'success',
      'Downloaded',
      'Prescription details downloaded.'
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);

      showToast(
        'success',
        'Link copied',
        'Prescription link copied to clipboard.'
      );
    } catch {
      showToast(
        'error',
        'Unable to copy',
        'Please copy the page URL manually.'
      );
    }
  }

  return (
    <DashboardLayout
      items={navItems}
      title="Patient Portal"
      headerTitle="Prescription Details"
      headerSubtitle={`Prescription #${prescription.id}`}
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut,
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden">
          <div className="bg-primary-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Stethoscope className="h-7 w-7" />
                <span className="text-lg font-bold">CareConnect</span>
              </div>
              <p className="text-sm text-primary-100">Prescription</p>
            </div>
          </div>

          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 border-b border-navy-100 pb-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-navy-400">Doctor</p>
                <p className="mt-0.5 font-semibold text-navy-900">
                  {doctorName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-navy-400">
                  Prescription ID
                </p>
                <p className="mt-0.5 font-semibold text-navy-900">
                  #{prescription.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-navy-400">Date</p>
                <p className="mt-0.5 font-medium text-navy-700">
                  {date ? formatDate(date.slice(0, 10)) : 'Date unavailable'}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-navy-400">Diagnosis</p>
                <p className="mt-0.5 font-medium text-navy-700">
                  {prescription.diagnosis || 'Not specified'}
                </p>
              </div>
            </div>

            {prescription.vitals &&
              Object.keys(prescription.vitals).length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-navy-900">
                    Vitals
                  </h3>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {Object.entries(prescription.vitals).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="rounded-lg bg-navy-50 p-3"
                        >
                          <p className="text-xs capitalize text-navy-400">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="mt-1 text-sm font-medium text-navy-700">
                            {String(value)}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {prescription.symptoms &&
              prescription.symptoms.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-navy-900">
                    Symptoms
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {prescription.symptoms.map((symptom, index) => (
                      <span key={index} className="badge-warning">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                <Pill className="h-4 w-4 text-primary-600" />
                Medicines
              </h3>

              {medicines.length === 0 ? (
                <p className="text-sm text-navy-500">
                  No medicine details are available.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-100 text-left text-xs text-navy-400">
                        <th className="py-2 pr-3 font-medium">Medicine</th>
                        <th className="py-2 pr-3 font-medium">Dosage</th>
                        <th className="py-2 pr-3 font-medium">Frequency</th>
                        <th className="py-2 font-medium">Duration</th>
                      </tr>
                    </thead>

                    <tbody>
                      {medicines.map((medicine, index) => (
                        <tr
                          key={index}
                          className="border-b border-navy-50"
                        >
                          <td className="py-3 pr-3 font-medium text-navy-900">
                            {medicine.name}
                          </td>
                          <td className="py-3 pr-3 text-navy-600">
                            {medicine.dosage || '—'}
                          </td>
                          <td className="py-3 pr-3 text-navy-600">
                            {medicine.frequency || '—'}
                          </td>
                          <td className="py-3 text-navy-600">
                            {medicine.duration || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {prescription.instructions && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-navy-900">
                  Instructions
                </h3>
                <p className="whitespace-pre-wrap rounded-lg bg-navy-50 p-3 text-sm leading-relaxed text-navy-600">
                  {prescription.instructions}
                </p>
              </div>
            )}

            {prescription.advice && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-navy-900">
                  Advice
                </h3>
                <p className="rounded-lg bg-navy-50 p-3 text-sm leading-relaxed text-navy-600">
                  {prescription.advice}
                </p>
              </div>
            )}

            {prescription.followUpDate && (
              <div className="rounded-lg bg-primary-50 p-3 text-sm text-primary-700">
                Follow-up recommended on{' '}
                <span className="font-semibold">
                  {formatDate(prescription.followUpDate)}
                </span>
              </div>
            )}

            <div className="border-t border-navy-100 pt-4 text-right">
              <p className="font-semibold italic text-navy-900">
                {doctorName}
              </p>
              <p className="text-xs text-navy-400">
                Prescribing doctor
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={downloadDetails}
          >
            <Download className="h-4 w-4" />
            Download details
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            onClick={copyLink}
          >
            <Share2 className="h-4 w-4" />
            Copy link
          </Button>
        </div>

        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => navigate('/patient/prescriptions')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to prescriptions
        </Button>
      </div>
    </DashboardLayout>
  );
}
