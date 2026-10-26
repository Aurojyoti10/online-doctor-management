import type { ReactNode } from 'react';
import { Sidebar, MobileBottomNav, type NavItem } from '@/components/shared/Sidebar';
import { DashboardHeader } from '@/components/shared/DashboardHeader';

interface DashboardLayoutProps {
  items: NavItem[];
  title: string;
  headerTitle: string;
  headerSubtitle?: string;
  footerItem?: NavItem;
  children: ReactNode;
}

export function DashboardLayout({ items, title, headerTitle, headerSubtitle, footerItem, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-navy-50 flex">
      <Sidebar items={items} title={title} footerItem={footerItem} />
      <div className="flex-1 min-w-0 flex flex-col">
        <DashboardHeader title={headerTitle} subtitle={headerSubtitle} />
        <main className="flex-1 p-4 sm:p-6 lg:px-8 pb-20 lg:pb-8">
          {children}
        </main>
        <MobileBottomNav items={items} />
      </div>
    </div>
  );
}
