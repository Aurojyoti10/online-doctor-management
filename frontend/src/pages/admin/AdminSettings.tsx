import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { Shield, Bell, Globe, Building2 } from 'lucide-react';
import { LayoutDashboard, Stethoscope, Users, CalendarDays, FileText, BarChart3, Settings, LogOut } from 'lucide-react';

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

export function AdminSettings() {
  const { showToast } = useToast();
  return (
    <DashboardLayout items={navItems} title="Admin Portal" headerTitle="Settings" headerSubtitle="Platform configuration" footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary-600" /> Platform Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Allow new doctor registrations</p><p className="text-xs text-navy-500">Let doctors self-register on the platform</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => showToast('success', 'Setting Updated', 'Platform setting saved.')} />
                <div className="w-11 h-6 bg-navy-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Require doctor verification</p><p className="text-xs text-navy-500">New doctors must be verified before going live</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => showToast('success', 'Setting Updated', 'Verification setting saved.')} />
                <div className="w-11 h-6 bg-navy-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Enable online consultations</p><p className="text-xs text-navy-500">Allow video consultation feature</p></div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => showToast('success', 'Setting Updated', 'Online consultation setting saved.')} />
                <div className="w-11 h-6 bg-navy-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary-600" /> Notification Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {['New doctor registration alerts', 'Payment failure notifications', 'Daily revenue summary', 'Appointment cancellation alerts'].map(item => (
              <div key={item} className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-navy-900">{item}</p>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => showToast('success', 'Updated', `${item} preference updated.`)} />
                  <div className="w-11 h-6 bg-navy-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary-600" /> Security</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Two-factor authentication</p><p className="text-xs text-navy-500">Required for admin accounts</p></div>
              <Button variant="outline" size="sm" onClick={() => showToast('info', '2FA Setup', 'Two-factor authentication setup.')}>Configure</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Change admin password</p><p className="text-xs text-navy-500">Update your account password</p></div>
              <Button variant="outline" size="sm" onClick={() => showToast('info', 'Change Password', 'Password change form.')}>Change</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
