import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Stethoscope, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Find Doctors', path: '/doctors' },
  { label: 'Specializations', path: '/specializations' },
  { label: 'How It Works', path: '/#how-it-works' },
  { label: 'For Doctors', path: '/#for-doctors' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    setMobileOpen(false);
    if (path.includes('#')) {
      const [route, hash] = path.split('#');
      navigate(route);
      setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-navy-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-900">CareConnect</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.path)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  location.pathname === link.path.split('#')[0]
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Register</Button>
          </div>

          <button className="md:hidden p-2 text-navy-600" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-navy-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.path)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50 rounded-lg"
              >
                {link.label}
              </button>
            ))}
            <div className="flex gap-2 pt-3 border-t border-navy-100">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setMobileOpen(false); navigate('/login'); }}>Login</Button>
              <Button size="sm" className="flex-1" onClick={() => { setMobileOpen(false); navigate('/register'); }}>Register</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
