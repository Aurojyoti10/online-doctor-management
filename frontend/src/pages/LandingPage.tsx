import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Stethoscope, ShieldCheck, Clock, HeartPulse, Users, Star, ArrowRight, CheckCircle2, Quote } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { DoctorCard } from '@/components/shared/DoctorCard';
import { doctors } from '@/data/doctors';
import { specializations } from '@/data/specializations';
import * as Icons from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');

  const topDoctors = doctors.slice(0, 6);
  const popularSpecs = specializations.slice(0, 8);

  const handleSearch = () => {
    navigate(`/doctors?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-primary-50/60 to-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" /> Trusted by 50,000+ patients across India
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-900 leading-tight">
              Find the right doctor.<br />Book care with confidence.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-navy-600 max-w-2xl mx-auto">
              Discover doctors, compare profiles, view availability, and book appointments — all in one place. Your health, simplified.
            </p>
          </div>

          {/* Search Module */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-white rounded-2xl shadow-elevated border border-navy-100 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                  <label className="text-xs font-medium text-navy-500 mb-1 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="text"
                      placeholder="Search doctors, clinics or specialties"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-500 mb-1 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="text"
                      placeholder="City or area"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="input pl-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-navy-500 mb-1 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
              </div>
              <Button size="lg" className="w-full mt-4" onClick={handleSearch}>
                <Search className="w-5 h-5" /> Search Doctors
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="text-xs text-navy-500">Popular:</span>
              {['Dermatologist', 'Cardiologist', 'Pediatrician', 'General Physician'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/doctors?q=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 text-xs font-medium text-navy-600 bg-white border border-navy-200 rounded-full hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Specializations */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Popular Specializations</h2>
              <p className="section-subtitle mt-1">Find the right specialist for your health needs</p>
            </div>
            <button onClick={() => navigate('/specializations')} className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularSpecs.map((spec) => {
              const IconComp = (Icons as unknown as Record<string, React.ElementType>)[spec.icon] || Stethoscope;
              return (
                <button
                  key={spec.id}
                  onClick={() => navigate(`/doctors?spec=${spec.id}`)}
                  className="card-hover p-5 text-left group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                    <IconComp className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-navy-900 text-sm">{spec.name}</h3>
                  <p className="text-xs text-navy-500 mt-1 line-clamp-2">{spec.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Doctors */}
      <section className="py-12 lg:py-16 bg-navy-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="section-title">Top Doctors</h2>
              <p className="section-subtitle mt-1">Highly rated doctors trusted by patients</p>
            </div>
            <button onClick={() => navigate('/doctors')} className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topDoctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onView={() => navigate(`/doctors/${doc.id}`)}
                onBook={() => navigate(`/doctors/${doc.id}?book=1`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">How CareConnect Works</h2>
            <p className="section-subtitle mt-1">Book your appointment in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Search & Compare', desc: 'Find doctors by specialization, location, or availability. Compare profiles, ratings, and fees.' },
              { icon: Calendar, title: 'Book Appointment', desc: 'Choose a date and time that works for you. Pay securely online with UPI, card, or net banking.' },
              { icon: HeartPulse, title: 'Get Care', desc: 'Visit the doctor in person or online. Get your prescription and follow-up care digitally.' },
            ].map((step, i) => (
              <div key={i} className="relative card p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-primary-600" />
                </div>
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-navy-100 text-navy-600 text-sm font-bold flex items-center justify-center">{i + 1}</div>
                <h3 className="font-semibold text-navy-900">{step.title}</h3>
                <p className="text-sm text-navy-500 mt-2 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 lg:py-16 bg-navy-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">Why Choose CareConnect</h2>
            <p className="section-subtitle mt-1">We make healthcare accessible, transparent, and convenient</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: 'Verified Doctors', desc: 'Every doctor is verified and credentials-checked' },
              { icon: Clock, title: 'Instant Booking', desc: 'Book appointments in under 2 minutes' },
              { icon: Star, title: 'Patient Reviews', desc: 'Read real reviews from verified patients' },
              { icon: HeartPulse, title: 'Online Consultation', desc: 'Talk to doctors from the comfort of home' },
            ].map((item, i) => (
              <div key={i} className="card p-5">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-semibold text-navy-900 text-sm">{item.title}</h3>
                <p className="text-xs text-navy-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">What Our Patients Say</h2>
            <p className="section-subtitle mt-1">Real stories from real patients</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Venkat', city: 'Chennai', text: 'CareConnect made it so easy to find a dermatologist near me. I booked an appointment in minutes and got great care!', rating: 5 },
              { name: 'Rahul Sharma', city: 'Mumbai', text: 'The online consultation feature saved me a trip to the clinic. The doctor was professional and the prescription was instant.', rating: 5 },
              { name: 'Sneha Reddy', city: 'Hyderabad', text: 'I love how I can compare doctors, read reviews, and see availability before booking. Best healthcare app I have used.', rating: 5 },
            ].map((t, i) => (
              <div key={i} className="card p-6">
                <Quote className="w-8 h-8 text-primary-100 mb-3" />
                <div className="flex gap-0.5 text-warning-500 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm text-navy-700 leading-relaxed">{t.text}</p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-navy-50">
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">{t.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                    <p className="text-xs text-navy-500">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 lg:py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: '50,000+', label: 'Happy Patients' },
              { icon: Stethoscope, value: '1,200+', label: 'Verified Doctors' },
              { icon: Calendar, value: '100,000+', label: 'Appointments Booked' },
              { icon: Star, value: '4.8/5', label: 'Average Rating' },
            ].map((stat, i) => (
              <div key={i} className="text-white">
                <stat.icon className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <p className="text-2xl lg:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-primary-100 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Doctors CTA */}
      <section id="for-doctors" className="py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 lg:p-12 bg-gradient-to-br from-navy-900 to-navy-800 text-white text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">Are you a doctor?</h2>
            <p className="text-navy-300 mt-3 max-w-xl mx-auto">Join CareConnect and reach thousands of patients. Manage your schedule, consultations, and prescriptions — all in one place.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
              <Button size="lg" onClick={() => navigate('/login?role=doctor')} className="bg-white text-navy-900 hover:bg-navy-100">
                Doctor Login
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate('/register')} className="text-white hover:bg-white/10 border border-white/20">
                Join as Doctor
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-navy-300">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Free to join</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Manage your schedule</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Digital prescriptions</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
