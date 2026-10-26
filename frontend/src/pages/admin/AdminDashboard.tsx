
import { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  IndianRupee,
  Clock,
  TrendingUp,
  LayoutDashboard,
  Stethoscope,
  Users as UsersIcon,
  CalendarDays,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';

import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const API_URL = 'http://localhost:5001/api';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Patients', path: '/admin/patients', icon: UsersIcon },
  { label: 'Specializations', path: '/admin/specializations', icon: FileText },
  { label: 'Schedules', path: '/admin/schedules', icon: CalendarDays },
  { label: 'Appointments', path: '/admin/appointments', icon: Calendar },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

interface DashboardData {
  totals: {
    doctors: number;
    patients: number;
    appointments: number;
    todayAppointments: number;
    pendingRequests: number;
    revenue: number;
  };
  appointmentTrend: { date: string; appointments: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  patientGrowth: { month: string; patients: number }[];
  specPopularity: { name: string; count: number }[];
}

const emptyDashboard: DashboardData = {
  totals: {
    doctors: 0,
    patients: 0,
    appointments: 0,
    todayAppointments: 0,
    pendingRequests: 0,
    revenue: 0,
  },
  appointmentTrend: [],
  statusDistribution: [],
  patientGrowth: [],
  specPopularity: [],
};

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const storedAuth = localStorage.getItem('careconnect_auth');

        if (!storedAuth) {
          throw new Error('Please log in as an administrator.');
        }

        const parsedAuth = JSON.parse(storedAuth);
        const token = parsedAuth.token;

        if (!token) {
          throw new Error('Your session has expired. Please log in again.');
        }

        const response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Unable to load dashboard data.'
          );
        }

        setDashboard(result.data);
        setError('');
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load dashboard data.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const { totals } = dashboard;

  return (
    <DashboardLayout
      items={navItems}
      title="Admin Portal"
      headerTitle="Dashboard"
      headerSubtitle="Platform overview and statistics"
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut,
      }}
    >
      {loading && (
        <p className="mb-4 text-sm text-navy-500">
          Loading live dashboard data...
        </p>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total Doctors"
          value={totals.doctors}
          icon={Stethoscope}
          color="primary"
        />

        <StatCard
          label="Total Patients"
          value={totals.patients}
          icon={Users}
          color="teal"
        />

        <StatCard
          label="Total Appointments"
          value={totals.appointments}
          icon={Calendar}
          color="success"
        />

        <StatCard
          label="Today's Appts"
          value={totals.todayAppointments}
          icon={Clock}
          color="warning"
        />

        <StatCard
          label="Revenue"
          value={formatCurrency(totals.revenue)}
          icon={IndianRupee}
          color="primary"
        />

        <StatCard
          label="Pending Requests"
          value={totals.pendingRequests}
          icon={TrendingUp}
          color="error"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointments Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dashboard.appointmentTrend}>
                <defs>
                  <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="appointments" stroke="#2563eb" strokeWidth={2} fill="url(#colorAppt)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={dashboard.statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                >
                  {dashboard.statusDistribution.map((entry, i) => (
                    <Cell key={`${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dashboard.patientGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="patients" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Specialization Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dashboard.specPopularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
  type="category"
  dataKey="name"
  tick={{ fontSize: 10, fill: '#94a3b8' }}
  axisLine={false}
  tickLine={false}
  width={100}
/>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
