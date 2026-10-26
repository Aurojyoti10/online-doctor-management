
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Stethoscope,
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  role: z.enum(['patient', 'admin']),
  adminSetupKey: z.string().optional(),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'Select a gender',
  }),
})
.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
)
.refine(
  (data) =>
    data.role !== 'admin' ||
    Boolean(data.adminSetupKey?.trim()),
  {
    message: 'Admin setup key is required',
    path: ['adminSetupKey'],
  }
);

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'patient',
      adminSetupKey: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      dateOfBirth: '',
      gender: undefined,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);

    try {
      const result = await registerUser({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role,
        adminSetupKey: data.adminSetupKey,
      });

      if (!result.success) {
        showToast(
          'error',
          'Registration Failed',
          result.error || 'Please try again.'
        );
        return;
      }

      if (data.role === 'admin') {
        showToast(
          'success',
          'Admin Account Created',
          'Please log in using the Admin role.'
        );

        navigate('/login?role=admin');
      } else {
        showToast(
          'success',
          'Account Created',
          'Welcome to CareConnect!'
        );

        navigate('/patient/dashboard');
      }
    } catch {
      showToast(
        'error',
        'Registration Failed',
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 to-teal-700 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              CareConnect
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mt-12 leading-tight">
            Join CareConnect<br />
            and manage healthcare online
          </h2>

          <p className="text-teal-100 mt-4 max-w-md">
            Create your account to access healthcare services,
            appointments, and digital health records.
          </p>
        </div>

        <div className="space-y-3 text-teal-100 text-sm">
          <div>✓ Book appointments with verified doctors</div>
          <div>✓ Access medical information</div>
          <div>✓ Manage appointments and prescriptions</div>
          <div>✓ Access your account securely</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-navy-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-navy-900">
              CareConnect
            </span>
          </div>

          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-navy-900">
              Create Account
            </h1>

            <p className="text-sm text-navy-500 mt-1">
              Register for your CareConnect account
            </p>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-6 space-y-4"
            >
              {/* Account role */}
              <div>
                <label className="label" htmlFor="role">
                  Register As
                </label>

                <select
                  id="role"
                  {...register('role')}
                  className={cn(
                    'input',
                    errors.role && 'border-error-500'
                  )}
                >
                  <option value="patient">Patient</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {/* Admin setup key */}
              {selectedRole === 'admin' && (
                <div>
                  <label className="label" htmlFor="adminSetupKey">
                    Admin Setup Key
                  </label>

                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                    <input
                      id="adminSetupKey"
                      {...register('adminSetupKey')}
                      type="password"
                      autoComplete="off"
                      placeholder="Enter your admin setup key"
                      className={cn(
                        'input pl-10',
                        errors.adminSetupKey && 'border-error-500'
                      )}
                    />
                  </div>

                  {errors.adminSetupKey && (
                    <p className="mt-1 text-xs text-error-600">
                      {errors.adminSetupKey.message}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-navy-500">
                    Admin registration requires an authorized setup key.
                  </p>
                </div>
              )}

              {/* Full name */}
              <div>
                <label className="label" htmlFor="fullName">
                  Full Name
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                  <input
                    id="fullName"
                    {...register('fullName')}
                    placeholder="Enter your full name"
                    className={cn(
                      'input pl-10',
                      errors.fullName && 'border-error-500'
                    )}
                  />
                </div>

                {errors.fullName && (
                  <p className="mt-1 text-xs text-error-600">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                  <input
                    id="email"
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={cn(
                      'input pl-10',
                      errors.email && 'border-error-500'
                    )}
                  />
                </div>

                {errors.email && (
                  <p className="mt-1 text-xs text-error-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="label" htmlFor="phone">
                  Phone
                </label>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                  <input
                    id="phone"
                    {...register('phone')}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className={cn(
                      'input pl-10',
                      errors.phone && 'border-error-500'
                    )}
                  />
                </div>

                {errors.phone && (
                  <p className="mt-1 text-xs text-error-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Date of birth and gender */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="dateOfBirth">
                    Date of Birth
                  </label>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                    <input
                      id="dateOfBirth"
                      {...register('dateOfBirth')}
                      type="date"
                      className={cn(
                        'input pl-10',
                        errors.dateOfBirth && 'border-error-500'
                      )}
                    />
                  </div>

                  {errors.dateOfBirth && (
                    <p className="mt-1 text-xs text-error-600">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label" htmlFor="gender">
                    Gender
                  </label>

                  <select
                    id="gender"
                    {...register('gender')}
                    className={cn(
                      'input',
                      errors.gender && 'border-error-500'
                    )}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>

                  {errors.gender && (
                    <p className="mt-1 text-xs text-error-600">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                  <input
                    id="password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className={cn(
                      'input pl-10 pr-10',
                      errors.password && 'border-error-500'
                    )}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-xs text-error-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="label" htmlFor="confirmPassword">
                  Confirm Password
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />

                  <input
                    id="confirmPassword"
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className={cn(
                      'input pl-10',
                      errors.confirmPassword && 'border-error-500'
                    )}
                  />
                </div>

                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-error-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={loading}
              >
                {selectedRole === 'admin'
                  ? 'Create Admin Account'
                  : 'Create Account'}
              </Button>
            </form>

            <p className="text-center text-sm text-navy-600 mt-6">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-primary-600 font-semibold hover:text-primary-700"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
