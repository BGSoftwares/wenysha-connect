/**
 * API client for Django REST backend.
 * Uses VITE_API_BASE_URL and JWT stored in localStorage.
 */

import { queryClient } from "./queryClient";

const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    return "/api";
  }
  return url.replace(/\/$/, "");
};

export const ACCESS_TOKEN_KEY = "ablegodcollege_access_token";
const REFRESH_KEY = "ablegodcollege_refresh_token";
const USER_KEY = "ablegodcollege_user";
export const SESSION_ACTIVITY_KEY = "ablegodcollege_last_activity";
export const INACTIVITY_LOGOUT_KEY = "ablegodcollege_inactivity_logout_at";
export const AUTH_STATE_EVENT = "ablegodcollege:auth-state-changed";

function dispatchAuthStateChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_STATE_EVENT));
  }
}

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string, user?: { id: number; email: string; username: string; role?: string; full_name?: string }): void {
  // A new login may belong to a different person on this browser. Drop cached
  // portal responses before the new identity starts issuing queries.
  queryClient.clear();
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
  localStorage.removeItem(INACTIVITY_LOGOUT_KEY);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  dispatchAuthStateChange();
}

export function clearAuth(): void {
  queryClient.clear();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
  dispatchAuthStateChange();
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
    must_change_password?: boolean;
    mfa_setup_required?: boolean;
  };
}

export interface ApiError {
  detail?: unknown;
  [key: string]: unknown;
}

function formatErrorValue(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number") return [String(value)];
  if (Array.isArray(value)) return value.flatMap(formatErrorValue);
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, nested]) => {
      const messages = formatErrorValue(nested);
      return messages.map(message => `${key}: ${message}`);
    });
  }
  return [];
}

/** Extract a user-facing message from an API error or thrown value. */
export function getErrorMessage(err: unknown): string {
  if (err == null) return "Something went wrong.";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null) {
    const error = err as ApiError;
    const detailMessages = formatErrorValue(error.detail);
    if (detailMessages.length) return detailMessages.join(" ");

    // Django REST Framework validation responses put errors under fields such
    // as `email` or `username`, without a top-level `detail` key.
    const fieldMessages = Object.entries(error)
      .filter(([key]) => !["status", "statusText", "code", "message"].includes(key))
      .flatMap(([field, value]) => formatErrorValue(value).map(message => `${field}: ${message}`));
    if (fieldMessages.length) return fieldMessages.join(" ");
    if ("message" in error) return String(error.message);
  }
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
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  };
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw { detail: "Unable to reach the server. Please check your internet connection or try again later." } as ApiError;
  }
  // Renew an expired access token once, then retry the protected request.
  if (res.status === 401 && token && !/\/auth\/(login|token\/refresh)\//.test(path)) {
    try {
      const refreshedToken = await refreshAccessToken();
      (headers as Record<string, string>)["Authorization"] = `Bearer ${refreshedToken}`;
      res = await fetch(url, { ...init, headers });
    } catch {
      clearAuth();
    }
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = typeof data === "object" && data !== null ? data : {};
    // Keep DRF's field errors intact. Replacing them with the HTTP status text
    // made valid-looking form submissions surface only as "Bad Request".
    if (!Object.keys(err).length) err.detail = res.statusText || `Request failed (${res.status})`;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) =>
    request<T>(path, { method: "GET", params }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),

  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "POST", body }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),

  patchForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: "PATCH", body }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export async function downloadAuthenticatedFile(path: string, filename: string): Promise<void> {
  const base = getApiBaseUrl();
  const apiBase = new URL(base, window.location.origin);
  const url = path.startsWith("http")
    ? new URL(path).toString()
    : new URL(`${apiBase.pathname.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`, apiBase.origin).toString();
  const apiOrigin = apiBase.origin;
  const token = getToken();
  const sendAuthorization = new URL(url).origin === apiOrigin;
  const fetchFile = (accessToken?: string | null) => fetch(url, {
    headers: sendAuthorization && accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });

  let response = await fetchFile(sendAuthorization ? token : null);
  if (response.status === 401 && token && sendAuthorization) {
    try {
      response = await fetchFile(await refreshAccessToken());
    } catch {
      clearAuth();
    }
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw data && typeof data === "object" ? data : { detail: "Could not download this file." };
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename || "download";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** Returned instead of tokens when the account has two-step verification turned on. */
export interface MfaChallenge {
  mfa_required: true;
  mfa_token: string;
  mfa_method: "email" | "totp";
  masked_destination: string | null;
  expires_in: number;
}

export type LoginResult = LoginResponse | MfaChallenge;

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return (result as MfaChallenge).mfa_required === true;
}

/** Step 1: password. Resolves with tokens, or with an MfaChallenge that must be completed via verifyMfa(). */
export async function login(email: string, password: string): Promise<LoginResult> {
  const data = await api.post<LoginResult>("/auth/login/", { email, password });
  if (isMfaChallenge(data)) return data;
  setTokens(data.access, data.refresh, data.user);
  return data;
}

/** Step 2: the 6-digit code from the authenticator app (or email). */
export async function verifyMfa(mfaToken: string, code: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>("/auth/mfa/verify/", { mfa_token: mfaToken, code });
  setTokens(data.access, data.refresh, data.user);
  return data;
}

export async function resendMfaCode(mfaToken: string): Promise<{ detail: string; mfa_token: string; masked_destination: string | null; expires_in: number }> {
  return api.post("/auth/mfa/resend/", { mfa_token: mfaToken });
}

/** Store a fresh token pair (e.g. after a password change revoked the old refresh token). */
export function applySessionTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

/**
 * Tell the server to revoke this device's refresh token. Call it right before
 * clearAuth(): the token is read synchronously, so clearing storage afterwards is safe.
 */
export function revokeSession(): void {
  const refresh = getRefreshToken();
  if (!refresh) return;
  const base = getApiBaseUrl().replace(/\/$/, "");
  void fetch(`${base}/auth/logout/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    keepalive: true,
  }).catch(() => undefined);
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
  const refreshUrl = `${base.replace(/\/$/, "")}/auth/token/refresh/`;
  const res = await fetch(refreshUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(String((data as ApiError).detail) || "Refresh failed");
  const tokens = data as { access?: string; refresh?: string };
  if (!tokens.access) throw new Error("Refresh response did not include an access token");
  const access = tokens.access;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  // Simple JWT can rotate the refresh token. Persist it so a later renewal
  // does not reuse an expired token.
  if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
  return access;
}
