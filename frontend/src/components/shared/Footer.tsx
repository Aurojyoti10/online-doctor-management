import { Link } from 'react-router-dom';
import { Stethoscope, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const footerLinks = {
  'For Patients': [
    { label: 'Find Doctors', path: '/doctors' },
    { label: 'Book Appointment', path: '/doctors' },
    { label: 'My Appointments', path: '/patient/appointments' },
    { label: 'Medical History', path: '/patient/medical-history' },
  ],
  'For Doctors': [
    { label: 'Doctor Login', path: '/login?role=doctor' },
    { label: 'Doctor Dashboard', path: '/doctor/dashboard' },
    { label: 'Manage Availability', path: '/doctor/availability' },
    { label: 'Join CareConnect', path: '/register' },
  ],
  Company: [
    { label: 'About Us', path: '/' },
    { label: 'How It Works', path: '/' },
    { label: 'Contact', path: '/' },
    { label: 'Privacy Policy', path: '/' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-navy-900 text-navy-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">CareConnect</span>
            </Link>
            <p className="text-sm text-navy-400 max-w-xs leading-relaxed">
              Find the right doctor. Book care with confidence. Your trusted healthcare companion for seamless doctor discovery and appointment booking.
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center hover:bg-primary-600 transition-colors" aria-label="Social media">
                  <Icon className="w-4 h-4 text-navy-300" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-sm text-navy-400 hover:text-primary-400 transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-navy-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-navy-500">© 2026 CareConnect. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-navy-500">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> support@careconnect.in</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +91 1800 200 100</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
