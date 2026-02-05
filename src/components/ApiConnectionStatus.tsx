import { useApiConnection } from '@/hooks/useApiConnection';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ApiConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

const ApiConnectionStatus = ({ showDetails = false, className }: ApiConnectionStatusProps) => {
  const { isConnected, isChecking, lastChecked, checkConnection, apiBaseUrl } = useApiConnection();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
        isConnected === null ? "bg-muted text-muted-foreground" :
        isConnected ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
      )}>
        {isChecking ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : isConnected ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span className="font-medium">
          {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
        </span>
      </div>

      {!isConnected && !isChecking && (
        <Button
          variant="ghost"
          size="sm"
          onClick={checkConnection}
          className="h-8 px-2"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      {showDetails && (
        <div className="text-xs text-muted-foreground">
          <p>API: {apiBaseUrl}</p>
          {lastChecked && (
            <p>Last check: {lastChecked.toLocaleTimeString()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiConnectionStatus;
