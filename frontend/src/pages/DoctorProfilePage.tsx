import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, MapPin, Clock, Video, Calendar, Award, Languages, HeartPulse, ArrowLeft, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RatingStars } from '@/components/ui/RatingStars';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { doctors } from '@/data/doctors';
import { reviews } from '@/data/medical';
import { formatCurrency, formatDate, getDaysFromToday, getDayName, getDayNumber, getMonthShort } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/States';

const tabs = ['About', 'Experience', 'Services', 'Reviews', 'Location'] as const;
type Tab = typeof tabs[number];

export function DoctorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('About');
  const [selectedDate, setSelectedDate] = useState(getDaysFromToday(1)[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const doctor = doctors.find((d) => d.id === id);
  const doctorReviews = reviews.filter((r) => r.doctorId === id);

  const dateOptions = useMemo(() => getDaysFromToday(7), []);

  const timeSlots = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM'];
  const unavailableSlots = ['10:30 AM', '11:30 AM', '05:00 PM'];

  const ratingBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    doctorReviews.forEach((r) => { breakdown[r.rating as keyof typeof breakdown]++; });
    return breakdown;
  }, [doctorReviews]);

  if (!doctor) {
    return (
      <div className="min-h-screen bg-navy-50 flex items-center justify-center">
        <EmptyState icon={HeartPulse} title="Doctor not found" description="The doctor you are looking for is not available." action={<Button onClick={() => navigate('/doctors')}>Browse Doctors</Button>} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Profile header */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {doctor.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-navy-900">{doctor.name}</h1>
                {doctor.verified && <CheckCircle2 className="w-5 h-5 text-primary-600 fill-primary-50" />}
              </div>
              <p className="text-navy-600 mt-1">{doctor.specializationName}</p>
              <p className="text-sm text-navy-500 mt-0.5">{doctor.qualifications}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-navy-600">
                <span className="flex items-center gap-1"><Award className="w-4 h-4 text-navy-400" /> {doctor.experienceYears} years experience</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-navy-400" /> {doctor.area}, {doctor.city}</span>
                <span className="flex items-center gap-1"><Languages className="w-4 h-4 text-navy-400" /> {doctor.languages.join(', ')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <RatingStars rating={doctor.rating} reviews={doctor.reviewCount} />
                <Badge variant="success" dot>{doctor.nextAvailable}</Badge>
                {doctor.onlineConsultation && <Badge variant="teal"><Video className="w-3 h-3" /> Online Available</Badge>}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-bold text-navy-900">{formatCurrency(doctor.consultationFee)}</p>
              <p className="text-xs text-navy-500">Consultation fee</p>
              <div className="flex flex-col gap-2 mt-4">
                <Button onClick={() => navigate(`/doctors/${doctor.id}/book`)}>Book Appointment</Button>
                {doctor.onlineConsultation && <Button variant="outline">Start Online Consultation</Button>}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tabs content */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="flex gap-1 px-4 border-b border-navy-100 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={cn('px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors', activeTab === tab ? 'border-primary-600 text-primary-700' : 'border-transparent text-navy-500 hover:text-navy-700')}>
                    {tab}
                  </button>
                ))}
              </div>
              <CardContent className="p-5">
                {activeTab === 'About' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-2">About Doctor</h3>
                      <p className="text-sm text-navy-600 leading-relaxed">{doctor.about}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900 mb-2">Education</h3>
                      <div className="space-y-3">
                        {doctor.education.map((edu, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-navy-50 rounded-lg">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                              <Award className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-navy-900">{edu.degree}</p>
                              <p className="text-xs text-navy-500">{edu.institution}</p>
                              <p className="text-xs text-navy-400 mt-0.5">{edu.year}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'Experience' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-navy-900">Professional Experience</h3>
                    {doctor.experience.map((exp, i) => (
                      <div key={i} className="relative pl-6 pb-4 border-l-2 border-navy-100 last:border-l-0">
                        <div className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
                        <p className="text-sm font-semibold text-navy-900">{exp.role}</p>
                        <p className="text-xs text-navy-500 mt-0.5">{exp.organization}</p>
                        <p className="text-xs text-navy-400 mt-0.5">{exp.duration}</p>
                        {exp.description && <p className="text-sm text-navy-600 mt-1.5">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'Services' && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-navy-900 mb-3">Services & Fees</h3>
                    {doctor.services.map((service, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-navy-50 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-navy-900">{service.name}</p>
                          <p className="text-xs text-navy-500 mt-0.5">{service.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary-700">{formatCurrency(service.fee)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'Reviews' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="text-center sm:text-left">
                        <p className="text-4xl font-bold text-navy-900">{doctor.rating}</p>
                        <RatingStars rating={doctor.rating} showValue={false} size="sm" />
                        <p className="text-xs text-navy-500 mt-1">{doctor.reviewCount} reviews</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-navy-500 w-3">{star}</span>
                            <Star className="w-3 h-3 text-warning-400 fill-current" />
                            <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
                              <div className="h-full bg-warning-400 rounded-full" style={{ width: `${(ratingBreakdown[star as keyof typeof ratingBreakdown] / doctorReviews.length) * 100 || 0}%` }} />
                            </div>
                            <span className="text-xs text-navy-500 w-6 text-right">{ratingBreakdown[star as keyof typeof ratingBreakdown]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-navy-100">
                      {doctorReviews.length === 0 ? (
                        <EmptyState icon={Star} title="No reviews yet" description="Be the first to review this doctor." />
                      ) : (
                        doctorReviews.map((review) => (
                          <div key={review.id} className="p-4 bg-navy-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">{review.patientName.split(' ').map(n => n[0]).join('')}</div>
                                <div>
                                  <p className="text-sm font-semibold text-navy-900">{review.patientName}</p>
                                  <p className="text-xs text-navy-400">{formatDate(review.date)}</p>
                                </div>
                              </div>
                              <RatingStars rating={review.rating} showValue={false} size="sm" />
                            </div>
                            <p className="text-sm text-navy-600 mt-2">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'Location' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-navy-900">Clinic Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-navy-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-navy-900">{doctor.hospital}</p>
                          <p className="text-sm text-navy-500">{doctor.location}, {doctor.city}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-navy-400 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-navy-900">Working Hours</p>
                          {doctor.availability.map((day) => (
                            <div key={day.day} className="flex items-center gap-3 text-sm">
                              <span className="text-navy-600 w-20">{day.day}</span>
                              {day.enabled ? (
                                <span className="text-navy-500">{day.ranges.map(r => `${r.start} - ${r.end}`).join(', ')}</span>
                              ) : (
                                <span className="text-error-500">Unavailable</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Map placeholder */}
                    <div className="h-48 bg-navy-100 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-navy-400 mx-auto mb-1" />
                        <p className="text-sm text-navy-500">Map view — {doctor.area}, {doctor.city}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Booking sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-5 sticky top-6">
              <h3 className="font-semibold text-navy-900 mb-4">Book an Appointment</h3>

              {/* Date picker */}
              <p className="text-xs font-medium text-navy-500 mb-2">Select Date</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {dateOptions.map((date) => (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border-2 flex-shrink-0 transition-colors',
                      selectedDate === date ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-navy-100 text-navy-600 hover:border-navy-200'
                    )}
                  >
                    <span className="text-[10px] uppercase">{getDayName(date)}</span>
                    <span className="text-lg font-bold">{getDayNumber(date)}</span>
                    <span className="text-[10px]">{getMonthShort(date)}</span>
                  </button>
                ))}
              </div>

              {/* Time slots */}
              <p className="text-xs font-medium text-navy-500 mb-2 mt-4">Available Slots</p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => {
                  const unavailable = unavailableSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      disabled={unavailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'px-2 py-2 text-xs font-medium rounded-lg border transition-colors',
                        unavailable ? 'border-navy-100 text-navy-300 cursor-not-allowed line-through' :
                        selectedSlot === slot ? 'border-primary-600 bg-primary-600 text-white' : 'border-navy-200 text-navy-700 hover:border-primary-300 hover:bg-primary-50'
                      )}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>

              {selectedSlot && (
                <div className="mt-4 p-3 bg-primary-50 rounded-lg animate-fade-in">
                  <p className="text-xs text-navy-600">Selected: <span className="font-semibold text-primary-700">{formatDate(selectedDate)} at {selectedSlot}</span></p>
                </div>
              )}

              <Button
                className="w-full mt-4"
                disabled={!selectedSlot}
                onClick={() => navigate(`/doctors/${doctor.id}/book?date=${selectedDate}&time=${encodeURIComponent(selectedSlot!)}`)}
              >
                {selectedSlot ? 'Proceed to Book' : 'Select a Time Slot'}
              </Button>

              <div className="flex items-center gap-2 mt-3 text-xs text-navy-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> Free cancellation up to 2 hours before
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
