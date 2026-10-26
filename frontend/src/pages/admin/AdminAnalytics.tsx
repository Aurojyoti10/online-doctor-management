import { useEffect, useState } from 'react';
import {
  CalendarDays, Users, Stethoscope, IndianRupee,
  RefreshCw, LayoutDashboard, FileText,
  BarChart3, Settings, LogOut
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/Card';
import { StatCard } from '@/components/shared/StatCard';

const API = 'http://localhost:5001/api';

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Patients', path: '/admin/patients', icon: Users },
  { label: 'Specializations', path: '/admin/specializations', icon: FileText },
  { label: 'Schedules', path: '/admin/schedules', icon: CalendarDays },
  { label: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings }
];

type AnalyticsData = {
  totals: {
    doctors: number;
    patients: number;
    appointments: number;
    todayAppointments: number;
    pendingRequests: number;
    revenue: number;
  };
  appointmentTrend: { date: string; appointments: number }[];
  statusDistribution: {
    name: string;
    value: number;
    color: string;
  }[];
  patientGrowth: { month: string; patients: number }[];
  specPopularity: { name: string; count: number }[];
};

function getToken(): string | undefined {
  try {
    return JSON.parse(
      localStorage.getItem('careconnect_auth') || '{}'
    ).token;
  } catch {
    return undefined;
  }
}

const money = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const token = getToken();

      if (!token) {
        throw new Error('Session missing. Please log in again.');
      }

      const response = await fetch(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not load analytics');
      }

      setData(result.data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const completedCount =
    data?.statusDistribution.find(
      status => status.name === 'completed'
    )?.value || 0;

  const completionRate = data?.totals.appointments
    ? Math.round(
        (completedCount / data.totals.appointments) * 100
      )
    : 0;

  return (
    <DashboardLayout
      items={navItems}
      title="Admin Portal"
      headerTitle="Analytics"
      headerSubtitle="Live statistics from your database"
      footerItem={{
        label: 'Logout',
        path: '/login',
        icon: LogOut
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-navy-500">
          Metrics reflect current database records.
        </p>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm hover:bg-navy-50 disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}{' '}
          <button className="underline" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <Card>
          <CardContent>
            <p className="py-10 text-center text-navy-500">
              Loading analytics…
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Appointments"
              value={data.totals.appointments}
              icon={CalendarDays}
              color="primary"
            />
            <StatCard
              label="Registered Patients"
              value={data.totals.patients}
              icon={Users}
              color="success"
            />
            <StatCard
              label="Doctor Records"
              value={data.totals.doctors}
              icon={Stethoscope}
              color="warning"
            />
            <StatCard
              label="Recorded Revenue"
              value={money(data.totals.revenue)}
              icon={IndianRupee}
              color="primary"
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm text-navy-500">
                  Today's appointments
                </p>
                <p className="mt-2 text-2xl font-semibold text-navy-900">
                  {data.totals.todayAppointments}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-navy-500">
                  Scheduled requests
                </p>
                <p className="mt-2 text-2xl font-semibold text-navy-900">
                  {data.totals.pendingRequests}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-navy-500">
                  Appointment completion rate
                </p>
                <p className="mt-2 text-2xl font-semibold text-navy-900">
                  {completionRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Appointments — last 7 days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {data.appointmentTrend.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.appointmentTrend}>
                        <defs>
                          <linearGradient
                            id="apptFill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#2563eb"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="100%"
                              stopColor="#2563eb"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="appointments"
                          stroke="#2563eb"
                          fill="url(#apptFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="pt-16 text-center text-sm text-navy-400">
                      No appointment trend data yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointment status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  {data.statusDistribution.some(s => s.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.statusDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={92}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {data.statusDistribution.map((status, index) => (
                            <Cell
                              key={`${status.name}-${index}`}
                              fill={
                                status.color ||
                                ['#f59e0b', '#22c55e', '#2563eb',
                                  '#ef4444', '#64748b'][index % 5]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="pt-16 text-center text-sm text-navy-400">
                      No appointment status data yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {data.patientGrowth.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.patientGrowth}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="patients"
                          stroke="#16a34a"
                          fill="#16a34a"
                          fillOpacity={0.12}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="pt-16 text-center text-sm text-navy-400">
                      No registration data yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doctors by specialization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {data.specPopularity.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.specPopularity}
                        layout="vertical"
                        margin={{ left: 10, right: 12 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={125}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#7c3aed"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="pt-16 text-center text-sm text-navy-400">
                      No specialization data yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        !loading && !error && (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-navy-500">
                No analytics data was returned.
              </p>
            </CardContent>
          </Card>
        )
      )}
    </DashboardLayout>
  );
}