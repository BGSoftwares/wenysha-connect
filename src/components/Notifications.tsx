import { useWebSocket } from "@/hooks/useWebSocket";
import { Bell, RefreshCw, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationsProps {
  className?: string;
  compact?: boolean;
}

const Notifications = ({ className, compact = false }: NotificationsProps) => {
  const { connected, messages, error, reconnect, clearMessages } = useWebSocket();

  if (compact) {
    return (
      <div className={cn("relative", className)}>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {messages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </Button>
        <span className={cn(
          "absolute bottom-0 right-0 h-2 w-2 rounded-full",
          connected ? "bg-primary" : "bg-muted-foreground"
        )} />
      </div>
    );
  }

  return (
    <div className={cn("p-4 border rounded-lg bg-card", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Live Notifications
        </h3>
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            connected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "Live" : "Offline"}
          </span>
          {!connected && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reconnect}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearMessages}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}

      <div className="max-h-48 overflow-auto space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {connected ? "No notifications yet" : "Waiting for connection..."}
          </p>
        ) : (
          messages.map((m, idx) => {
            const payload = m?.payload || m;
            const event = (payload as Record<string, unknown>)?.event as string;
            
            return (
              <div 
                key={idx} 
                className="p-2 border rounded bg-muted/50 animate-in slide-in-from-top-2"
              >
                {event && (
                  <span className="text-xs font-medium text-primary capitalize">
                    {event.replace(/_/g, ' ')}
                  </span>
                )}
                <pre className="text-xs text-muted-foreground mt-1 overflow-auto">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;
