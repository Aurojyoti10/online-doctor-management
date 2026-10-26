import { Link, useLocation } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  footerItem?: NavItem;
}

export function Sidebar({ items, title, footerItem }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-navy-100 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-navy-100">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 9h-6L8 4z" /></svg>
          </div>
          <span className="font-bold text-navy-900">CareConnect</span>
        </Link>
        <p className="text-xs text-navy-500 mt-1 px-1">{title}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn('sidebar-link', active && 'sidebar-link-active')}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {footerItem && (
        <div className="px-3 py-3 border-t border-navy-100">
          <Link to={footerItem.path} className="sidebar-link text-error-600 hover:bg-error-50">
            <footerItem.icon className="w-5 h-5 flex-shrink-0" />
            <span>{footerItem.label}</span>
          </Link>
        </div>
      )}
    </aside>
  );
}

interface MobileBottomNavProps {
  items: NavItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-navy-100 flex items-center justify-around h-16 px-2 no-tap-highlight">
      {items.slice(0, 5).map((item) => {
        const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn('flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg flex-1 max-w-[72px]', active ? 'text-primary-700' : 'text-navy-400')}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

interface MobileTopBarProps {
  title: string;
  showBack?: boolean;
}

export function MobileTopBar({ title, showBack = false }: MobileTopBarProps) {
  return (
    <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-navy-100 px-4 h-14 flex items-center">
      {showBack && (
        <button onClick={() => window.history.back()} className="mr-3 p-1 text-navy-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      <h1 className="text-base font-semibold text-navy-900">{title}</h1>
    </div>
  );
}
