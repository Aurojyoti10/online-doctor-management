

import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

function getFallbackPath(pathname: string): string {
  if (/^\/patient\/appointments\/[^/]+/.test(pathname)) {
    return '/patient/appointments';
  }

  if (/^\/patient\/prescriptions\/[^/]+/.test(pathname)) {
    return '/patient/prescriptions';
  }

  if (/^\/doctor\/patients\/[^/]+/.test(pathname)) {
    return '/doctor/patients';
  }

  if (/^\/doctor\/consultation\/[^/]+/.test(pathname)) {
    return '/doctor/appointments';
  }

  if (/^\/admin\/doctors\/[^/]+/.test(pathname)) {
    return '/admin/doctors';
  }

  if (/^\/admin\/patients\/[^/]+/.test(pathname)) {
    return '/admin/patients';
  }

  if (pathname.startsWith('/patient/')) return '/patient/dashboard';
  if (pathname.startsWith('/doctor/')) return '/doctor/dashboard';
  if (pathname.startsWith('/admin/')) return '/admin/dashboard';
  if (pathname.startsWith('/doctors/')) return '/doctors';
  if (pathname === '/specializations') return '/';

  return '/';
}

export function GlobalBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    if (location.key === 'default') {
      navigate(getFallbackPath(location.pathname), { replace: true });
      return;
    }

    navigate(-1);
  };

  if (
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register'
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Go back"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-navy-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 shadow-lg transition hover:bg-navy-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <ArrowLeft className="h-5 w-5" />
      <span>Back</span>
    </button>
  );
}
