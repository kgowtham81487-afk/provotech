'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from './api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  roles: string[];
  primaryField?: any;
  secondaryField?: any;
  xp?: number;
  level?: number;
  streakDays?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (input: { email: string; password: string; displayName: string; username: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('ees_access_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    const res = await apiRequest<User>('/users/me', { method: 'GET' }, storedToken);
    if (res.success && res.data) {
      setUser(res.data);
    } else {
      localStorage.removeItem('ees_access_token');
      setUser(null);
      setToken(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (input: { email: string; password: string }) => {
    setIsLoading(true);
    const res = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (res.success && res.data) {
      localStorage.setItem('ees_access_token', res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: res.error?.message || 'Login failed.' };
  };

  const register = async (input: { email: string; password: string; displayName: string; username: string }) => {
    setIsLoading(true);
    const res = await apiRequest<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (res.success && res.data) {
      localStorage.setItem('ees_access_token', res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: res.error?.message || 'Registration failed.' };
  };

  const logout = async () => {
    const storedToken = localStorage.getItem('ees_access_token');
    if (storedToken) {
      await apiRequest('/auth/logout', { method: 'POST' }, storedToken).catch(() => null);
    }
    localStorage.removeItem('ees_access_token');
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') ?? false;
  const isAdmin = (user?.roles?.includes('ADMIN') || isSuperAdmin) ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
