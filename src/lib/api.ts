/**
 * API client for Django REST backend.
 * Uses VITE_API_BASE_URL and JWT stored in localStorage.
 */

const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    return "http://127.0.0.1:8000/api";
  }
  return url.replace(/\/$/, "");
};

const TOKEN_KEY = "wenyasha_access_token";
const REFRESH_KEY = "wenyasha_refresh_token";
const USER_KEY = "wenyasha_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string, user?: { id: number; email: string; username: string; role?: string; full_name?: string }): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): { id: number; email: string; username: string; role?: string; full_name?: string } | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: number; email: string; username: string; role?: string; full_name?: string };
  } catch {
    return null;
  }
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    username: string;
    role?: string;
    full_name?: string;
  };
}

export interface ApiError {
  detail?: string | string[] | Record<string, string[]>;
  [key: string]: unknown;
}

/** Extract a user-facing message from an API error or thrown value. */
export function getErrorMessage(err: unknown): string {
  if (err == null) return "Something went wrong.";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "detail" in err) {
    const d = (err as ApiError).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d) && d.length) return String(d[0]);
    if (typeof d === "object" && d !== null) {
      const first = Object.values(d)[0];
      return Array.isArray(first) ? String(first[0]) : String(first);
    }
  }
  if (typeof err === "object" && err !== null && "message" in err) return String((err as { message: string }).message);
  return "Something went wrong.";
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...init } = options;
  const base = getApiBaseUrl();
  let url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  if (params && Object.keys(params).length) {
    const search = new URLSearchParams(params).toString();
    url += (url.includes("?") ? "&" : "?") + search;
  }
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = typeof data === "object" ? data : { detail: res.statusText };
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: "GET", params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>("/auth/login/", { email, password });
  setTokens(data.access, data.refresh, data.user);
  return data;
}

export async function signup(payload: {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  role: "student" | "parent" | "teacher" | "accounts";
  additional_info?: Record<string, unknown>;
}): Promise<{ detail: string }> {
  return api.post<{ detail: string }>("/auth/signup/", payload);
}

export async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  const base = getApiBaseUrl();
  const res = await fetch(`${base.replace("/api", "")}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String((data as ApiError).detail) || "Refresh failed");
  const access = (data as { access: string }).access;
  localStorage.setItem(TOKEN_KEY, access);
  return access;
}
