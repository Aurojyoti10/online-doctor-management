import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { medicalHistory } from '@/data/medical';
import { formatDate } from '@/lib/utils';
import { Stethoscope, Pill, FileText, AlertCircle, Activity, Calendar } from 'lucide-react';
import { LayoutDashboard, Search, CalendarDays, FileText as FileTextIcon, Activity as ActivityIcon, User, Settings, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileTextIcon },
  { label: 'Medical History', path: '/patient/medical-history', icon: ActivityIcon },
  { label: 'Profile', path: '/patient/profile', icon: User },
  { label: 'Settings', path: '/patient/settings', icon: Settings },
];

const typeConfig = {
  consultation: { icon: Stethoscope, color: 'text-primary-600 bg-primary-50', label: 'Consultation' },
  diagnosis: { icon: Activity, color: 'text-teal-600 bg-teal-50', label: 'Diagnosis' },
  prescription: { icon: Pill, color: 'text-success-600 bg-success-50', label: 'Prescription' },
  report: { icon: FileText, color: 'text-warning-600 bg-warning-50', label: 'Report' },
  condition: { icon: AlertCircle, color: 'text-error-600 bg-error-50', label: 'Condition' },
  allergy: { icon: AlertCircle, color: 'text-error-600 bg-error-50', label: 'Allergy' },
};

export function PatientMedicalHistory() {
  const years = [...new Set(medicalHistory.map(h => h.year))].sort((a, b) => Number(b) - Number(a));

  return (
    <DashboardLayout items={navItems} title="Patient Portal" headerTitle="Medical History" headerSubtitle="Your complete health timeline" footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Consultations', value: medicalHistory.filter(h => h.type === 'consultation').length, icon: Stethoscope },
          { label: 'Prescriptions', value: medicalHistory.filter(h => h.type === 'prescription').length, icon: Pill },
          { label: 'Conditions', value: medicalHistory.filter(h => h.type === 'condition').length, icon: Activity },
          { label: 'Allergies', value: medicalHistory.filter(h => h.type === 'allergy').length, icon: AlertCircle },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <item.icon className="w-5 h-5 text-primary-600 mb-2" />
            <p className="text-xl font-bold text-navy-900">{item.value}</p>
            <p className="text-xs text-navy-500">{item.label}</p>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {years.map((year) => (
          <div key={year}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-white flex items-center justify-center text-sm font-bold">{year}</div>
              <div className="h-px flex-1 bg-navy-100" />
            </div>
            <div className="space-y-3 pl-2">
              {medicalHistory.filter(h => h.year === year).map((entry) => {
                const config = typeConfig[entry.type];
                return (
                  <Card key={entry.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <config.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-navy-900 text-sm">{entry.title}</p>
                          <span className="text-xs text-navy-400 flex items-center gap-1 flex-shrink-0"><Calendar className="w-3 h-3" /> {formatDate(entry.date)}</span>
                        </div>
                        <p className="text-sm text-navy-600 mt-1">{entry.description}</p>
                        {entry.doctorName && <p className="text-xs text-navy-400 mt-1">— {entry.doctorName}</p>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
