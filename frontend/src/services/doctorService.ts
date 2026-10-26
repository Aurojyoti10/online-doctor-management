

import type { Doctor } from '@/types';

const API_URL = 'http://localhost:5001/api';

interface ApiDoctor {
  id: number;
  user_id: number;
  name: string;
  email: string;
  specialization: string;
  qualification: string | null;
  experience_years: number | null;
  consultation_fee: string | number | null;
  city: string | null;
  hospital: string | null;
  about: string | null;
  languages: string | null;
  created_at?: string;
  updated_at?: string;
}

interface DoctorsResponse {
  success: boolean;
  data: ApiDoctor[];
  message?: string;
}

export async function getDoctors(): Promise<Doctor[]> {
  const response = await fetch(`${API_URL}/doctors`);

  if (!response.ok) {
    throw new Error(`Failed to load doctors (${response.status})`);
  }

  const result: DoctorsResponse = await response.json();

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error(result.message || 'Unexpected doctors API response');
  }

  return result.data.map((item): Doctor => {
    const qualification = item.qualification ?? '';
    const specialization = item.specialization ?? '';
    const name = item.name ?? '';

    const languages = item.languages
      ? item.languages
          .split(',')
          .map((language) => language.trim())
          .filter(Boolean)
      : [];

    return {
      id: String(item.id),

      name: name.startsWith('Dr.') ? name : `Dr. ${name}`,

      specializationId: specialization
        .toLowerCase()
        .replace(/\s+/g, '-'),

      specializationName: specialization,
      qualifications: qualification,
      degrees: qualification
        .split(',')
        .map((degree) => degree.trim())
        .filter(Boolean),

      experienceYears: Number(item.experience_years ?? 0),
      consultationFee: Number(item.consultation_fee ?? 0),

      // Actual fields returned by the backend
      city: item.city ?? '',
      location: item.city ?? '',
      hospital: item.hospital ?? '',
      about: item.about ?? '',
      languages,

      // Not yet supported by the database/API
      rating: 0,
      reviewCount: 0,
      area: '',
      education: [],
      experience: [],
      services: [],
      gender: 'male',
      verified: false,
      onlineConsultation: false,
      nextAvailable: '',
      availability: [],
      status: 'active',
      joinedDate: '',
      email: item.email,
      phone: '',
    };
  });
}
