const makeWsUrl = () => {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
  // If API base contains /api, strip it when constructing ws host
  const host = api.replace(/\/api$/, "");
  return host.replace(/^http/, "ws") + "/ws/notifications/";
};

export const WS_URL = makeWsUrl();

import { getToken } from './api';

/**
 * Create a reconnecting WebSocket with simple exponential backoff.
 * Returns an object containing `.close()` and `.send()` to interact with the socket.
 */
export function createWebSocket(
  onOpen?: () => void,
  onMessage?: (data: unknown) => void,
  onClose?: () => void,
  onError?: (error: Event) => void,
  opts?: { maxRetries?: number; initialDelayMs?: number; onReconnect?: (attempt: number, delayMs: number) => void }
) {
  const urlBase = WS_URL;
  const maxRetries = opts?.maxRetries ?? 6;
  const initialDelayMs = opts?.initialDelayMs ?? 1000;

  let ws: WebSocket | null = null;
  let closedByUser = false;
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    attempts += 1;
    const token = getToken();
    const url = token ? `${urlBase}?token=${encodeURIComponent(token)}` : urlBase;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      onError?.(err as Event);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      attempts = 0; // reset attempts on successful connect
      onOpen?.();
    };

    ws.onmessage = (ev) => {
      let payload: unknown = ev.data;
      try { payload = JSON.parse(ev.data); } catch {}
      onMessage?.(payload);
    };

    ws.onclose = (ev) => {
      ws = null;
      onClose?.();
      if (!closedByUser) scheduleReconnect();
    };

    ws.onerror = (err) => {
      onError?.(err as Event);
    };
  };

  const scheduleReconnect = () => {
    if (attempts >= maxRetries) return;
    const delay = Math.min(initialDelayMs * 2 ** (attempts - 1), 30_000);
    // notify caller about scheduled reconnect attempt
    try { opts?.onReconnect?.(attempts, delay); } catch {}
    reconnectTimer = setTimeout(() => {
      connect();
    }, delay);
  };

  connect();

  return {
    send: (data: any) => {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      } catch (e) {
        // ignore
      }
    },
    close: () => {
      closedByUser = true;
      if (reconnectTimer) clearTimeout(reconnectTimer as any);
      try { ws?.close(); } catch {}
    },
    _raw: () => ws,
  };
}
