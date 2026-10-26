import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, Mail, Lock, Eye, EyeOff, User, Building2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const roleConfig = {
  patient: { title: 'Patient Login', redirect: '/patient/dashboard', label: 'Patient' },
  doctor: { title: 'Doctor Login', redirect: '/doctor/dashboard', label: 'Doctor' },
  admin: { title: 'Admin Login', redirect: '/admin/dashboard', label: 'Admin' },
};

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as UserRole) || 'patient';
  const [role, setRole] = useState<UserRole>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    const result = await login(data.email, data.password, role);
    setLoading(false);
    if (result.success) {
      showToast('success', 'Login Successful', `Welcome back to CareConnect`);
      navigate(roleConfig[role].redirect);
    } else {
      showToast('error', 'Login Failed', result.error);
    }
  };

  const fillDemo = async (demoRole: UserRole) => {
    const emails = { patient: 'patient@demo.com', doctor: 'doctor@demo.com', admin: 'admin@demo.com' };
    setRole(demoRole);
    await onSubmit({ email: emails[demoRole], password: 'Demo@123' });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CareConnect</span>
          </div>
          <h2 className="text-3xl font-bold text-white mt-12 leading-tight">
            Your trusted partner<br />for better healthcare
          </h2>
          <p className="text-primary-100 mt-4 max-w-md">
            Book appointments with verified doctors, access your medical records, and get prescriptions — all in one place.
          </p>
        </div>
        <div className="space-y-3">
          {['50,000+ patients served', '1,200+ verified doctors', '4.8/5 average rating'].map((stat) => (
            <div key={stat} className="flex items-center gap-2 text-primary-100 text-sm">
              <ShieldCheck className="w-4 h-4" /> {stat}
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-navy-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-navy-900">CareConnect</span>
          </div>

          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-navy-900">{roleConfig[role].title}</h1>
            <p className="text-sm text-navy-500 mt-1">Welcome back. Please sign in to continue.</p>

            {/* Role tabs */}
            <div className="flex gap-1 p-1 bg-navy-100 rounded-xl mt-6">
              {(Object.keys(roleConfig) as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                    role === r ? 'bg-white text-primary-700 shadow-sm' : 'text-navy-500 hover:text-navy-700'
                  )}
                >
                  {roleConfig[r].label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={cn('input pl-10', errors.email && 'border-error-500')}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-error-600">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label">Password</label>
                  <button type="button" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={cn('input pl-10 pr-10', errors.password && 'border-error-500')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-error-600">{errors.password.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" className="rounded border-navy-300 text-primary-600 focus:ring-primary-500" />
                <label htmlFor="remember" className="text-sm text-navy-600">Remember me</label>
              </div>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-navy-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-navy-400">Demo Accounts</span></div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => fillDemo('patient')} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-navy-100 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <User className="w-5 h-5 text-primary-600" />
                <span className="text-xs font-medium text-navy-700">Patient</span>
              </button>
              <button onClick={() => fillDemo('doctor')} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-navy-100 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span className="text-xs font-medium text-navy-700">Doctor</span>
              </button>
              <button onClick={() => fillDemo('admin')} className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-navy-100 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                <Building2 className="w-5 h-5 text-navy-600" />
                <span className="text-xs font-medium text-navy-700">Admin</span>
              </button>
            </div>
            <p className="text-center text-xs text-navy-400 mt-3">Password for all demo accounts: <span className="font-mono font-medium text-navy-600">Demo@123</span></p>
          </div>

          <p className="text-center text-sm text-navy-600 mt-6">
            Don't have an account? <button onClick={() => navigate('/register')} className="text-primary-600 font-semibold hover:text-primary-700">Register</button>
          </p>
        </div>
      </div>
    </div>
  );
}
