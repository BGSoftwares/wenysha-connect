import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isOffline: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const navigate = useNavigate();

  const checkAuth = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const result = await api.get<User>('/api/me/');
    
    if (result.isOffline) {
      setIsOffline(true);
      // Keep existing user if offline
      setLoading(false);
      return;
    }

    setIsOffline(false);
    
    if (result.data) {
      setUser(result.data);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string) => {
    setError(null);
    setLoading(true);

    const result = await api.login(username, password);

    if (result.isOffline) {
      setIsOffline(true);
      setError('Cannot connect to server. Please check your connection.');
      setLoading(false);
      return false;
    }

    setIsOffline(false);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    await checkAuth();
    return true;
  };

  const logout = async () => {
    await api.logout();
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
