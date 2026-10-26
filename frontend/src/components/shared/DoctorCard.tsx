
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Doctor } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, getInitials } from '@/lib/utils';

interface DoctorAvatarProps {
  doctor: Doctor;
  size?: 'sm' | 'md' | 'lg';
}

export function DoctorAvatar({ doctor, size = 'md' }: DoctorAvatarProps) {
  const sizes = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
  };

  return doctor.avatar ? (
    <img
      src={doctor.avatar}
      alt={doctor.name}
      className={`${sizes[size]} rounded-xl object-cover bg-primary-50`}
    />
  ) : (
    <div
      className={`${sizes[size]} rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center font-semibold`}
    >
      {getInitials(doctor.name.replace('Dr. ', ''))}
    </div>
  );
}

interface DoctorCardProps {
  doctor: Doctor;
  onView?: (doctor: Doctor) => void;
  onBook?: (doctor: Doctor) => void;
  compact?: boolean;
}

export function DoctorCard({
  doctor,
  onView,
  onBook,
  compact = false,
}: DoctorCardProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    doctor.avatar
  );

  const city = doctor.city?.trim();
  const location = doctor.location?.trim();
  const hospital = doctor.hospital?.trim();

  // Avoid displaying the same city twice.
  const displayLocation =
    city && location && city.toLowerCase() !== location.toLowerCase()
      ? `${location}, ${city}`
      : city || location || '';

  const hasRating =
    doctor.reviewCount > 0 && doctor.rating > 0;

  return (
    <Card className="card-hover p-5 group">
      <div className="flex items-start gap-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={doctor.name}
            className={
              compact
                ? 'w-14 h-14 rounded-xl object-cover bg-primary-50 flex-shrink-0'
                : 'w-20 h-20 rounded-xl object-cover bg-primary-50 flex-shrink-0'
            }
            onError={() => setImageUrl(undefined)}
          />
        ) : (
          <DoctorAvatar
            doctor={doctor}
            size={compact ? 'sm' : 'md'}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-navy-900 truncate group-hover:text-primary-700 transition-colors">
              {doctor.name}
            </h3>

            {doctor.verified && (
              <CheckCircle2 className="w-4 h-4 text-primary-600 fill-primary-50 flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-navy-600 mt-0.5">
            {doctor.specializationName}
          </p>

          <p className="text-xs text-navy-500 mt-1 truncate">
            {doctor.qualifications || 'Qualifications not provided'}
          </p>
        </div>
      </div>

      {hasRating && (
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm font-medium text-navy-700">
            {doctor.rating.toFixed(1)} / 5
          </span>
          <span className="text-xs text-navy-500">
            {doctor.reviewCount}{' '}
            {doctor.reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      )}

      {!compact && (
        <div className="grid grid-cols-2 gap-y-2 mt-4 pt-4 border-t border-navy-100 text-xs text-navy-600">
          <div>
            <span className="text-navy-400">Experience</span>
            <p className="font-medium text-navy-700 mt-0.5">
              {doctor.experienceYears} years
            </p>
          </div>

          <div>
            <span className="text-navy-400">Consultation</span>
            <p className="font-medium text-navy-700 mt-0.5">
              {formatCurrency(doctor.consultationFee)}
            </p>
          </div>

          {(displayLocation || hospital) && (
            <div className="col-span-2">
              <span className="text-navy-400">
                {hospital ? 'Hospital / Clinic' : 'Location'}
              </span>

              {hospital && (
                <p className="font-medium text-navy-700 mt-0.5 truncate">
                  {hospital}
                </p>
              )}

              {displayLocation && (
                <p className="text-navy-600 mt-0.5 truncate">
                  {displayLocation}
                </p>
              )}
            </div>
          )}

          {doctor.languages?.length > 0 && (
            <div className="col-span-2">
              <span className="text-navy-400">Languages</span>
              <p className="font-medium text-navy-700 mt-0.5">
                {doctor.languages.join(', ')}
              </p>
            </div>
          )}
        </div>
      )}

      {doctor.onlineConsultation && (
        <div className="flex items-center gap-1.5 mt-4">
          <Badge variant="teal">Online consultation</Badge>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onView?.(doctor)}
        >
          View Profile
        </Button>

        <Button
          size="sm"
          className="flex-1"
          onClick={() => onBook?.(doctor)}
        >
          Book Appointment
        </Button>
      </div>
    </Card>
  );
}
