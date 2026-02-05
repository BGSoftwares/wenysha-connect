import { useEffect, useRef, useState, useCallback } from "react";
import { createWebSocket, WS_URL } from "@/lib/ws";

interface WebSocketMessage {
  type?: string;
  payload?: unknown;
  [key: string]: unknown;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = createWebSocket(
      () => {
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      },
      (message) => {
        setMessages(prev => [message as WebSocketMessage, ...prev].slice(0, 50));
      },
      () => {
        setConnected(false);
        
        // Auto-reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          setTimeout(connect, delay);
        }
      },
      () => {
        setError('WebSocket connection failed');
        setConnected(false);
      }
    );

    if (ws) {
      wsRef.current = ws;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((obj: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try { 
        wsRef.current.send(JSON.stringify(obj)); 
        return true;
      } catch (e) { 
        console.warn("WebSocket send failed", e);
        return false;
      }
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { 
    connected, 
    messages, 
    error,
    wsUrl: WS_URL,
    send, 
    reconnect,
    clearMessages,
  };
}
