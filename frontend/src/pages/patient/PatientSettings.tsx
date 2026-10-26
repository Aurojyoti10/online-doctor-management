import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { Bell, Shield, Moon, Globe, HelpCircle } from 'lucide-react';
import { LayoutDashboard, Search, CalendarDays, FileText, Activity, User, Settings, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
  { label: 'Find Doctors', path: '/patient/doctors', icon: Search },
  { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: FileText },
  { label: 'Medical History', path: '/patient/medical-history', icon: Activity },
  { label: 'Profile', path: '/patient/profile', icon: User },
  { label: 'Settings', path: '/patient/settings', icon: Settings },
];

export function PatientSettings() {
  const { showToast } = useToast();
  return (
    <DashboardLayout items={navItems} title="Patient Portal" headerTitle="Settings" headerSubtitle="Manage your preferences" footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary-600" /> Notifications</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Appointment reminders', desc: 'Get notified before your appointments' },
              { label: 'Prescription updates', desc: 'When a new prescription is available' },
              { label: 'Payment receipts', desc: 'Email receipts for your payments' },
              { label: 'Health tips', desc: 'Weekly health and wellness tips' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium text-navy-900">{item.label}</p><p className="text-xs text-navy-500">{item.desc}</p></div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => showToast('success', 'Setting Updated', `${item.label} preference updated.`)} />
                  <div className="w-11 h-6 bg-navy-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4 text-primary-600" /> Privacy & Security</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Two-factor authentication</p><p className="text-xs text-navy-500">Add an extra layer of security</p></div>
              <Button variant="outline" size="sm" onClick={() => showToast('info', '2FA Setup', 'Two-factor authentication setup will open here.')}>Enable</Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div><p className="text-sm font-medium text-navy-900">Change password</p><p className="text-xs text-navy-500">Update your account password</p></div>
              <Button variant="outline" size="sm" onClick={() => showToast('info', 'Change Password', 'Password change form will open here.')}>Change</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Moon className="w-4 h-4 text-primary-600" /> Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-navy-400" /><p className="text-sm font-medium text-navy-900">Language</p></div>
              <select className="input max-w-[160px]" defaultValue="en"><option value="en">English</option><option value="hi">Hindi</option><option value="ta">Tamil</option><option value="te">Telugu</option></select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-primary-600" /> Support</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-3 hover:bg-navy-50 rounded-lg text-sm text-navy-700">Help Center & FAQ</button>
              <button className="w-full text-left p-3 hover:bg-navy-50 rounded-lg text-sm text-navy-700">Contact Support</button>
              <button className="w-full text-left p-3 hover:bg-navy-50 rounded-lg text-sm text-navy-700">Terms & Conditions</button>
              <button className="w-full text-left p-3 hover:bg-navy-50 rounded-lg text-sm text-navy-700">Privacy Policy</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
