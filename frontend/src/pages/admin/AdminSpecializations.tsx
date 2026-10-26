import { useState } from 'react';
import { Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { specializations as initialSpecs } from '@/data/specializations';
import * as Icons from 'lucide-react';
import { LayoutDashboard, Stethoscope, Users, CalendarDays, FileText as FileTextIcon, BarChart3, Settings, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Patients', path: '/admin/patients', icon: Users },
  { label: 'Specializations', path: '/admin/specializations', icon: FileTextIcon },
  { label: 'Schedules', path: '/admin/schedules', icon: CalendarDays },
  { label: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminSpecializations() {
  const { showToast } = useToast();
  const [specs, setSpecs] = useState(initialSpecs);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', icon: 'Stethoscope', description: '' });

  const handleSave = () => {
    if (editTarget) {
      setSpecs(prev => prev.map(s => s.id === editTarget ? { ...s, name: form.name, description: form.description } : s));
      showToast('success', 'Specialization Updated', `${form.name} has been updated.`);
    } else {
      const newSpec = { id: `sp${Date.now()}`, name: form.name, icon: form.icon, description: form.description };
      setSpecs(prev => [...prev, newSpec]);
      showToast('success', 'Specialization Added', `${form.name} has been added.`);
    }
    setShowModal(false);
    setEditTarget(null);
    setForm({ name: '', icon: 'Stethoscope', description: '' });
  };

  const handleDelete = () => {
    const spec = specs.find(s => s.id === deleteTarget);
    setSpecs(prev => prev.filter(s => s.id !== deleteTarget));
    showToast('success', 'Specialization Removed', `${spec?.name} has been removed.`);
    setDeleteTarget(null);
  };

  const openEdit = (id: string) => {
    const spec = specs.find(s => s.id === id);
    if (spec) {
      setForm({ name: spec.name, icon: spec.icon, description: spec.description });
      setEditTarget(id);
      setShowModal(true);
    }
  };

  return (
    <DashboardLayout items={navItems} title="Admin Portal" headerTitle="Specializations" headerSubtitle={`${specs.length} specializations available`} footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
      <div className="flex justify-end mb-6">
        <Button onClick={() => { setForm({ name: '', icon: 'Stethoscope', description: '' }); setEditTarget(null); setShowModal(true); }}><Plus className="w-4 h-4" /> Add Specialization</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {specs.map((spec) => {
          const IconComp = (Icons as unknown as Record<string, React.ElementType>)[spec.icon] || FileText;
          return (
            <Card key={spec.id} className="card-hover p-5">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                  <IconComp className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(spec.id)} className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(spec.id)} className="p-1.5 text-error-400 hover:text-error-600 hover:bg-error-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-navy-900 mt-3">{spec.name}</h3>
              <p className="text-sm text-navy-500 mt-1">{spec.description}</p>
            </Card>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editTarget ? 'Edit Specialization' : 'Add Specialization'}>
        <div className="p-5 space-y-4">
          <Input label="Name" placeholder="e.g. Cardiologist" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Description" placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editTarget ? 'Save Changes' : 'Add'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove Specialization?" description="Are you sure you want to remove this specialization? Doctors in this category may be affected." confirmLabel="Yes, Remove" />
    </DashboardLayout>
  );
}
