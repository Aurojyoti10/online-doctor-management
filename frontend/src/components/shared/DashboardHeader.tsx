import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/shared/UserAvatar';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({
  title,
  subtitle,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const profilePath =
    user?.role === 'patient'
      ? '/patient/profile'
      : user?.role === 'doctor'
        ? '/doctor/profile'
        : '/admin/settings';

  const settingsPath =
    user?.role === 'patient'
      ? '/patient/settings'
      : user?.role === 'doctor'
        ? '/doctor/settings'
        : '/admin/settings';

  return (
    <header className="sticky top-0 z-30 border-b border-navy-100 bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-navy-900">
            {title}
          </h1>

          {subtitle && (
            <p className="hidden truncate text-xs text-navy-500 sm:block">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-label="Open profile menu"
              className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-navy-100"
            >
              <UserAvatar
                name={user?.name || 'User'}
                size="sm"
              />

              <span className="hidden max-w-[120px] truncate text-sm font-medium text-navy-700 sm:block">
                {user?.name || 'User'}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 animate-slide-up overflow-hidden rounded-xl border border-navy-100 bg-white shadow-elevated">
                <div className="border-b border-navy-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-navy-900">
                    {user?.name || 'User'}
                  </p>

                  <p className="truncate text-xs text-navy-500">
                    {user?.email || ''}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to={profilePath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    to={settingsPath}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-navy-700 hover:bg-navy-50"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}