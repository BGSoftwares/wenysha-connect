const makeWsUrl = () => {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
  // If API base contains /api, strip it when constructing ws host
  const host = api.replace(/\/api$/, "");
  return host.replace(/^http/, "ws") + "/ws/notifications/";
};

export const WS_URL = makeWsUrl();

export function createWebSocket(
  onOpen?: () => void, 
  onMessage?: (data: unknown) => void, 
  onClose?: () => void,
  onError?: (error: Event) => void
) {
  const url = WS_URL;
  
  try {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected to:', url);
      onOpen?.();
    };

    ws.onmessage = (ev) => {
      let payload;
      try { 
        payload = JSON.parse(ev.data); 
      } catch { 
        payload = ev.data; 
      }
      onMessage?.(payload);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      onClose?.();
    };

    ws.onerror = (err) => { 
      console.error("WebSocket error:", err);
      onError?.(err);
    };

    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    return null;
  }
}
