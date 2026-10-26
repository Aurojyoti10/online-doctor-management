

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

import { DoctorCard } from '@/components/shared/DoctorCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, CardSkeleton } from '@/components/ui/States';
import { Modal } from '@/components/ui/Modal';
import { specializations } from '@/data/specializations';
import { cn } from '@/lib/utils';
import { getDoctors } from '@/services/doctorService';
import type { Doctor } from '@/types';

type SortOption =
  | 'relevance'
  | 'experience'
  | 'rating'
  | 'fee_low'
  | 'fee_high'
  | 'availability';

interface DoctorFilters {
  specialization: string;
  location: string;
  minExperience: number;
  maxFee: number;
}

const initialFilters: DoctorFilters = {
  specialization: '',
  location: '',
  minExperience: 0,
  maxFee: 5000,
};

export function SearchDoctorsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [apiError, setApiError] = useState('');

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );

  const [locationQuery, setLocationQuery] = useState(
    searchParams.get('location') || ''
  );

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [sortOpen, setSortOpen] = useState(false);

  const [filters, setFilters] = useState<DoctorFilters>({
    ...initialFilters,
    specialization: searchParams.get('spec') || '',
  });

  // Load actual doctor records from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        setLoading(true);
        setApiError('');

        const data = await getDoctors();

        if (!cancelled) {
          setDoctors(data);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : 'Unable to load doctors.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDoctors();

    return () => {
      cancelled = true;
    };
  }, []);

  // Search, filter and sort the doctors returned by the API.
  const filteredDoctors = useMemo(() => {
    let result = [...doctors];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();

      result = result.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(query) ||
          doctor.specializationName.toLowerCase().includes(query) ||
          doctor.qualifications.toLowerCase().includes(query)
      );
    }

    if (locationQuery.trim()) {
      const query = locationQuery.trim().toLowerCase();

      result = result.filter(
        (doctor) =>
          doctor.city.toLowerCase().includes(query) ||
          doctor.area.toLowerCase().includes(query) ||
          doctor.location.toLowerCase().includes(query)
      );
    }

    if (filters.specialization) {
      const selected = specializations.find(
        (spec) => spec.id === filters.specialization
      );

      if (selected) {
        const aliases: Record<string, string[]> = {
          'General Physician': [
            'General Physician',
            'General Medicine',
          ],
        };

        const acceptedNames = (
          aliases[selected.name] ?? [selected.name]
        ).map((name) => name.toLowerCase());

        result = result.filter((doctor) =>
          acceptedNames.includes(
            doctor.specializationName.toLowerCase()
          )
        );
      }
    }

    if (filters.location.trim()) {
      const query = filters.location.trim().toLowerCase();

      result = result.filter(
        (doctor) =>
          doctor.city.toLowerCase().includes(query) ||
          doctor.area.toLowerCase().includes(query) ||
          doctor.location.toLowerCase().includes(query)
      );
    }

    if (filters.minExperience > 0) {
      result = result.filter(
        (doctor) => doctor.experienceYears >= filters.minExperience
      );
    }

    result = result.filter(
      (doctor) => doctor.consultationFee <= filters.maxFee
    );

    switch (sortBy) {
      case 'experience':
        result.sort(
          (a, b) => b.experienceYears - a.experienceYears
        );
        break;

      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;

      case 'fee_low':
        result.sort(
          (a, b) => a.consultationFee - b.consultationFee
        );
        break;

      case 'fee_high':
        result.sort(
          (a, b) => b.consultationFee - a.consultationFee
        );
        break;

      case 'availability':
        // Availability is not currently supplied by the backend.
        break;

      case 'relevance':
      default:
        break;
    }

    return result;
  }, [
    doctors,
    searchQuery,
    locationQuery,
    filters,
    sortBy,
  ]);

  const sortLabels: Record<SortOption, string> = {
    relevance: 'Relevance',
    experience: 'Experience',
    rating: 'Rating',
    fee_low: 'Fee: Low to High',
    fee_high: 'Fee: High to Low',
    availability: 'Earliest Availability',
  };

  const activeFilterCount =
    [
      filters.specialization,
      filters.location,
    ].filter(Boolean).length +
    (filters.minExperience > 0 ? 1 : 0) +
    (filters.maxFee < 5000 ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setFilters(initialFilters);
  };

  return (
    <div className="min-h-screen bg-navy-50">
      {/* Search header */}
      <div className="sticky top-0 z-30 border-b border-navy-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />

              <input
                type="text"
                placeholder="Search doctors, specialties"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                className="input pl-10"
              />
            </div>

            <div className="relative sm:w-48">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />

              <input
                type="text"
                placeholder="Location"
                value={locationQuery}
                onChange={(event) =>
                  setLocationQuery(event.target.value)
                }
                className="input pl-10"
              />
            </div>

            <Button
              variant="outline"
              className="lg:hidden"
              onClick={() => setShowFilters(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters

              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-primary-600 px-1.5 py-0.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-24">
              <FilterContent
                filters={filters}
                setFilters={setFilters}
              />
            </div>
          </aside>

          {/* Doctor results */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-navy-600">
                {loading ? (
                  'Loading doctors...'
                ) : (
                  <>
                    <span className="font-semibold text-navy-900">
                      {filteredDoctors.length}
                    </span>{' '}
                    doctors found

                    {searchQuery && (
                      <>
                        {' '}for{' '}
                        <span className="font-semibold text-navy-900">
                          {searchQuery}
                        </span>
                      </>
                    )}
                  </>
                )}
              </p>

              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  Sort: {sortLabels[sortBy]}
                  <ChevronDown className="h-4 w-4" />
                </button>

                {sortOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-48 rounded-xl border border-navy-100 bg-white py-1 shadow-elevated">
                    {(Object.keys(sortLabels) as SortOption[]).map(
                      (option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option);
                            setSortOpen(false);
                          }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm hover:bg-navy-50',
                            sortBy === option &&
                              'font-medium text-primary-700'
                          )}
                        >
                          {sortLabels[option]}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {apiError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{apiError}</p>

                <button
                  className="mt-2 underline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No doctors found"
                description="Try changing your search terms or filters."
                action={
                  <Button onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <DoctorCard
                    key={doctor.id}
                    doctor={doctor}
                    onView={() =>
                      navigate(`/doctors/${doctor.id}`)
                    }
                    onBook={() =>
                      navigate(`/doctors/${doctor.id}/book`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <Modal
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
        size="md"
      >
        <div className="p-5">
          <FilterContent
            filters={filters}
            setFilters={setFilters}
          />

          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setFilters(initialFilters)}
            >
              Clear Filters
            </Button>

            <Button
              className="flex-1"
              onClick={() => setShowFilters(false)}
            >
              Show {filteredDoctors.length} Results
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FilterContent({
  filters,
  setFilters,
}: {
  filters: DoctorFilters;
  setFilters: (filters: DoctorFilters) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-navy-900">
          Specialization
        </h4>

        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {specializations.map((specialization) => (
            <label
              key={specialization.id}
              className="flex cursor-pointer items-center gap-2 text-sm text-navy-600 hover:text-navy-900"
            >
              <input
                type="radio"
                name="spec"
                checked={
                  filters.specialization === specialization.id
                }
                onChange={() =>
                  setFilters({
                    ...filters,
                    specialization: specialization.id,
                  })
                }
                className="text-primary-600 focus:ring-primary-500"
              />

              {specialization.name}
            </label>
          ))}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-600">
            <input
              type="radio"
              name="spec"
              checked={!filters.specialization}
              onChange={() =>
                setFilters({
                  ...filters,
                  specialization: '',
                })
              }
            />
            All specializations
          </label>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-navy-900">
          Experience
        </h4>

        <div className="flex flex-wrap gap-2">
          {[
            { value: 0, label: 'All' },
            { value: 5, label: '5+ yrs' },
            { value: 10, label: '10+ yrs' },
            { value: 15, label: '15+ yrs' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setFilters({
                  ...filters,
                  minExperience: option.value,
                })
              }
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium',
                filters.minExperience === option.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-navy-200 text-navy-600 hover:bg-navy-50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold text-navy-900">
          Maximum Consultation Fee: ₹{filters.maxFee}
        </h4>

        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={filters.maxFee}
          onChange={(event) =>
            setFilters({
              ...filters,
              maxFee: Number(event.target.value),
            })
          }
          className="w-full accent-primary-600"
        />
      </div>
    </div>
  );
}
