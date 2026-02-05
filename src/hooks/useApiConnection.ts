import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export function useApiConnection() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    api.resetConnectionState();
    const connected = await api.checkConnection();
    setIsConnected(connected);
    setLastChecked(new Date());
    setIsChecking(false);
    return connected;
  }, []);

  useEffect(() => {
    checkConnection();

    // Re-check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    lastChecked,
    checkConnection,
    apiBaseUrl: api.getBaseUrl(),
  };
}
