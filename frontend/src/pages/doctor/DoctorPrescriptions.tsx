import { useNavigate } from 'react-router-dom';
import { FileText, Download, Printer, Send, Pill } from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/context/ToastContext';
import { prescriptions } from '@/data/medical';
import { formatDate } from '@/lib/utils';
import { LayoutDashboard, CalendarDays, Users, Clock, FileText as FileTextIcon, Star, IndianRupee, User, Settings, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
  { label: 'Patients', path: '/doctor/patients', icon: Users },
  { label: 'Availability', path: '/doctor/availability', icon: Clock },
  { label: 'Prescriptions', path: '/doctor/prescriptions', icon: FileTextIcon },
  { label: 'Reviews', path: '/doctor/reviews', icon: Star },
  { label: 'Earnings', path: '/doctor/earnings', icon: IndianRupee },
  { label: 'Profile', path: '/doctor/profile', icon: User },
  { label: 'Settings', path: '/doctor/settings', icon: Settings },
];

export function DoctorPrescriptions() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const doctorRx = prescriptions.filter(p => p.doctorId === 'd1');

  return (
    <DashboardLayout items={navItems} title="Doctor Portal" headerTitle="Prescriptions" headerSubtitle="View and manage issued prescriptions" footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
      {doctorRx.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No prescriptions issued" description="Complete a consultation to generate prescriptions." /></Card>
      ) : (
        <div className="space-y-4">
          {doctorRx.map((rx) => (
            <Card key={rx.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-navy-50">
                <div>
                  <p className="font-semibold text-navy-900">{rx.patientName}</p>
                  <p className="text-xs text-navy-500">{formatDate(rx.date)} • {rx.diagnosis}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => showToast('success', 'Downloaded', 'Prescription PDF downloaded.')}><Download className="w-3.5 h-3.5" /> PDF</Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-3.5 h-3.5" /> Print</Button>
                  <Button variant="outline" size="sm" onClick={() => showToast('success', 'Sent', 'Prescription sent to patient.')}><Send className="w-3.5 h-3.5" /> Send</Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
                  <div><p className="text-xs text-navy-400">Symptoms</p><p className="font-medium text-navy-700">{rx.symptoms.join(', ')}</p></div>
                  <div><p className="text-xs text-navy-400">Follow-up</p><p className="font-medium text-navy-700">{rx.followUpDate ? formatDate(rx.followUpDate) : 'Not required'}</p></div>
                </div>
                <div>
                  <p className="text-xs text-navy-400 mb-1.5 flex items-center gap-1"><Pill className="w-3 h-3" /> Medicines ({rx.medicines.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {rx.medicines.map((m, i) => <span key={i} className="badge-navy text-[10px]">{m.name} {m.dosage}</span>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
