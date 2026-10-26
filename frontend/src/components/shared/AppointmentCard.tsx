import { CalendarClock, Video, MapPin, Stethoscope, Clock } from 'lucide-react';
import type { Appointment } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { formatCurrency, formatDate } from '@/lib/utils';

interface AppointmentCardProps {
  appointment: Appointment;
  onView?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onRate?: () => void;
  showActions?: boolean;
  variant?: 'patient' | 'doctor';
}

export function AppointmentCard({ appointment, onView, onReschedule, onCancel, onRate, showActions = true, variant = 'patient' }: AppointmentCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <UserAvatar name={variant === 'patient' ? appointment.doctorName : appointment.patientName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-navy-900 text-sm truncate">
              {variant === 'patient' ? appointment.doctorName : appointment.patientName}
            </h3>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="text-xs text-navy-500 mt-0.5">{appointment.doctorSpecialization}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-navy-600">
            <span className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-navy-400" /> {formatDate(appointment.date)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-navy-400" /> {appointment.time}</span>
            <span className="flex items-center gap-1">
              {appointment.consultationType === 'online' ? <Video className="w-3.5 h-3.5 text-navy-400" /> : <MapPin className="w-3.5 h-3.5 text-navy-400" />}
              {appointment.consultationType === 'online' ? 'Online' : 'In-person'}
            </span>
            <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-navy-400" /> {formatCurrency(appointment.fee)}</span>
          </div>
          {appointment.reason && <p className="text-xs text-navy-500 mt-1.5 line-clamp-1">Reason: {appointment.reason}</p>}
        </div>
      </div>
      
{showActions && (
  <div className="flex gap-2 mt-3 pt-3 border-t border-navy-50">
    {appointment.status === 'confirmed' ||
    appointment.status === 'pending' ? (
      <Button
        variant="ghost"
        size="sm"
        className="text-error-600 hover:bg-error-50"
        onClick={onCancel}
      >
        Cancel
      </Button>
    ) : appointment.status === 'completed' ? (
      <Button
        size="sm"
        className="flex-1"
        onClick={onRate}
      >
        Rate
      </Button>
    ) : null}
  </div>
)}
</Card>
);
}
