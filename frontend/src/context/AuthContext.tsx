
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import type { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (
    email: string,
    password: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: 'patient' | 'admin';
    adminSetupKey?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  data?: {
    id: number | string;
    name: string;
    email: string;
    role: string;
  };
}

interface StoredAuth {
  user: User;
  token: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'careconnect_auth';
const API_URL = 'http://localhost:5001/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed: StoredAuth | User = JSON.parse(stored);

      // Support the previous version, which stored only the user.
      if ('user' in parsed && parsed.user) {
        setUser(parsed.user);
        setToken(parsed.token ?? null);
      } else {
        setUser(parsed as User);
        setToken(null);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveAuth = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken })
    );
  };

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.success || !result.data || !result.token) {
        return {
          success: false,
          error: result.message || 'Login failed. Please try again.',
        };
      }

      // The backend role is authoritative.
      if (result.data.role !== role) {
        return {
          success: false,
          error: `This account is registered as ${result.data.role}, not ${role}.`,
        };
      }

      const loggedInUser: User = {
        id: String(result.data.id),
        name: result.data.name,
        email: result.data.email,
        role: result.data.role as UserRole,
      };

      saveAuth(loggedInUser, result.token);
      return { success: true };
    } catch {
      return {
        success: false,
        error: 'Cannot connect to the server. Check that the backend is running.',
      };
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: 'patient' | 'admin';
    adminSetupKey?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const requestedRole = data.role ?? 'patient';

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
          role: requestedRole,
          ...(requestedRole === 'admin'
            ? { adminSetupKey: data.adminSetupKey }
            : {}),
        }),
      });

      const result: AuthResponse = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.message || 'Registration failed. Please try again.',
        };
      }

      // Admins must log in separately using the Admin role.
      if (requestedRole === 'admin') {
        return { success: true };
      }

      // Preserve automatic login for newly registered patients.
      return login(data.email, data.password, 'patient' as UserRole);
    } catch {
      return {
        success: false,
        error: 'Cannot connect to the server. Check that the backend is running.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
