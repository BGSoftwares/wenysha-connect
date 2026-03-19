import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, login as apiLogin, clearAuth, getStoredUser, getToken } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  full_name?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const result = await api.get<User>('/auth/me/');
      setUser(result);
      setIsOffline(false);
    } catch {
      // Try stored user as fallback
      const stored = getStoredUser();
      if (stored) {
        setUser(stored as User);
        setIsOffline(true);
      } else {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    setError(null);
    setLoading(true);

    try {
      const result = await apiLogin(username, password);
      setUser(result.user as User);
      setIsOffline(false);
      setLoading(false);
      return true;
    } catch (err: any) {
      setError(err?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    clearAuth();
    setUser(null);
    navigate('/portal');
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isOffline,
    login,
    logout,
    checkAuth,
  };
}
