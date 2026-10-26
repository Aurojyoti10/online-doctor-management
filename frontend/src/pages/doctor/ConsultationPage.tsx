import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Check, Save, Send, Printer, FileDown, Stethoscope, Pill } from 'lucide-react';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { appointments } from '@/data/appointments';
import { patients } from '@/data/patients';
import { formatDate } from '@/lib/utils';
import type { Medicine } from '@/types';
import { LayoutDashboard, CalendarDays, Users, Clock, FileText, Star, IndianRupee, User, Settings, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/doctor/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
  { label: 'Patients', path: '/doctor/patients', icon: Users },
  { label: 'Availability', path: '/doctor/availability', icon: Clock },
  { label: 'Prescriptions', path: '/doctor/prescriptions', icon: FileText },
  { label: 'Reviews', path: '/doctor/reviews', icon: Star },
  { label: 'Earnings', path: '/doctor/earnings', icon: IndianRupee },
  { label: 'Profile', path: '/doctor/profile', icon: User },
  { label: 'Settings', path: '/doctor/settings', icon: Settings },
];

export function ConsultationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const appointment = appointments.find(a => a.id === id);
  const patient = patients.find(p => p.id === appointment?.patientId);

  const [step, setStep] = useState<'consultation' | 'success'>('consultation');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [vitals, setVitals] = useState({ bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' });
  const [diagnoses, setDiagnoses] = useState<string[]>([]);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: '', dosage: '', frequency: '', duration: '', instructions: '', route: 'Oral' }]);
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  if (!appointment || !patient) {
    return <div className="min-h-screen flex items-center justify-center"><p>Appointment not found</p></div>;
  }

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const addDiagnosis = () => {
    if (diagnosisInput.trim() && !diagnoses.includes(diagnosisInput.trim())) {
      setDiagnoses([...diagnoses, diagnosisInput.trim()]);
      setDiagnosisInput('');
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    setMedicines(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '', route: 'Oral' }]);
  const removeMedicine = (i: number) => setMedicines(medicines.filter((_, idx) => idx !== i));

  const handleComplete = () => {
    setStep('success');
    showToast('success', 'Consultation Completed', 'Prescription has been generated and sent to patient.');
  };

  if (step === 'success') {
    return (
      <DashboardLayout items={navItems} title="Doctor Portal" headerTitle="Consultation Complete" headerSubtitle={patient.name} footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
              <Check className="w-12 h-12 text-success-500" />
            </div>
            <h2 className="text-xl font-bold text-navy-900">Consultation Completed Successfully!</h2>
            <p className="text-sm text-navy-500 mt-2">Prescription has been generated for {patient.name} and sent to their account.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button onClick={() => navigate('/doctor/appointments')}>Back to Appointments</Button>
              <Button variant="outline" onClick={() => navigate('/doctor/prescriptions')}>View Prescriptions</Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout items={navItems} title="Doctor Portal" headerTitle="Consultation" headerSubtitle={`${patient.name} • ${appointment.reason}`} footerItem={{ label: 'Logout', path: '/login', icon: LogOut }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Patient summary */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-semibold">{patient.name.split(' ').map(n => n[0]).join('')}</div>
            <div className="flex-1">
              <p className="font-semibold text-navy-900">{patient.name}</p>
              <p className="text-xs text-navy-500">{patient.age} yrs • {patient.gender} • Blood: {patient.bloodGroup}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-navy-400">{formatDate(appointment.date)} • {appointment.time}</p>
              <p className="text-xs text-navy-500">{appointment.reason}</p>
            </div>
          </div>
          {(patient.allergies.length > 0 || patient.conditions.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-navy-50">
              {patient.allergies.map((a, i) => <span key={`a${i}`} className="badge-error text-[10px]">Allergy: {a}</span>)}
              {patient.conditions.map((c, i) => <span key={`c${i}`} className="badge-warning text-[10px]">{c}</span>)}
            </div>
          )}
        </Card>

        {/* Symptoms */}
        <Card>
          <CardHeader><CardTitle>Symptoms</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <input type="text" value={symptomInput} onChange={(e) => setSymptomInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())} placeholder="Type a symptom and press Enter" className="input flex-1" />
              <Button variant="outline" size="sm" onClick={addSymptom}><Plus className="w-4 h-4" /> Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s, i) => (
                <span key={i} className="badge-warning cursor-pointer" onClick={() => setSymptoms(symptoms.filter(x => x !== s))}>{s} ✕</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vitals */}
        <Card>
          <CardHeader><CardTitle>Vitals</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <Input label="BP" placeholder="120/80" value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} />
              <Input label="Heart Rate" placeholder="72 bpm" value={vitals.heartRate} onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })} />
              <Input label="Temperature" placeholder="98.6°F" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} />
              <Input label="Weight" placeholder="70 kg" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} />
              <Input label="Height" placeholder="170 cm" value={vitals.height} onChange={(e) => setVitals({ ...vitals, height: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis */}
        <Card>
          <CardHeader><CardTitle>Diagnosis</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <input type="text" value={diagnosisInput} onChange={(e) => setDiagnosisInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDiagnosis())} placeholder="Type a diagnosis and press Enter" className="input flex-1" />
              <Button variant="outline" size="sm" onClick={addDiagnosis}><Plus className="w-4 h-4" /> Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {diagnoses.map((d, i) => (
                <span key={i} className="badge-primary cursor-pointer" onClick={() => setDiagnoses(diagnoses.filter(x => x !== d))}>{d} ✕</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={4} placeholder="Clinical notes and observations..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </CardContent>
        </Card>

        {/* Prescription */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Pill className="w-4 h-4 text-primary-600" /> Prescription</CardTitle>
              <Button variant="outline" size="sm" onClick={addMedicine}><Plus className="w-4 h-4" /> Add Medicine</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {medicines.map((med, i) => (
              <div key={i} className="p-3 bg-navy-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-navy-500">Medicine #{i + 1}</span>
                  {medicines.length > 1 && <button onClick={() => removeMedicine(i)} className="text-error-500 hover:text-error-700"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  <input placeholder="Medicine name" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} className="input text-sm" />
                  <input placeholder="Dosage (e.g. 500mg)" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} className="input text-sm" />
                  <select value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} className="input text-sm">
                    <option value="">Frequency</option><option>Once daily</option><option>Twice daily</option><option>Thrice daily</option><option>As needed</option>
                  </select>
                  <input placeholder="Duration (e.g. 5 days)" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} className="input text-sm" />
                  <select value={med.route} onChange={(e) => updateMedicine(i, 'route', e.target.value)} className="input text-sm">
                    <option>Oral</option><option>Topical</option><option>Injection</option><option>Inhalation</option>
                  </select>
                  <input placeholder="Instructions" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} className="input text-sm" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Advice & Follow-up */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Advice</CardTitle></CardHeader>
            <CardContent><Textarea rows={4} placeholder="General advice for the patient..." value={advice} onChange={(e) => setAdvice(e.target.value)} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Follow-up</CardTitle></CardHeader>
            <CardContent>
              <Input label="Follow-up Date" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <Button variant="outline" className="flex-1" onClick={() => showToast('success', 'Saved', 'Consultation saved as draft.')}><Save className="w-4 h-4" /> Save Draft</Button>
          <Button className="flex-1" onClick={handleComplete}><Check className="w-4 h-4" /> Complete Consultation</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
