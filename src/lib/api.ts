// API client for Django backend with automatic fallback

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

interface TokenPair {
  access: string;
  refresh: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  isOffline?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isBackendReachable: boolean | null = null;
  private connectionCheckPromise: Promise<boolean> | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokens(tokens: TokenPair) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getBaseUrl(): string {
    return API_BASE_URL;
  }

  // Check if backend is reachable
  async checkConnection(): Promise<boolean> {
    if (this.connectionCheckPromise) {
      return this.connectionCheckPromise;
    }

    this.connectionCheckPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${API_BASE_URL}/api/`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        this.isBackendReachable = response.ok || response.status === 401;
        return this.isBackendReachable;
      } catch (error) {
        console.warn('Backend not reachable, using mock data:', error);
        this.isBackendReachable = false;
        return false;
      } finally {
        this.connectionCheckPromise = null;
      }
    })();

    return this.connectionCheckPromise;
  }

  async isConnected(): Promise<boolean> {
    if (this.isBackendReachable !== null) {
      return this.isBackendReachable;
    }
    return this.checkConnection();
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        localStorage.setItem('access_token', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Check connection first
    const connected = await this.isConnected();
    if (!connected) {
      return {
        error: 'Backend not reachable',
        status: 0,
        isOffline: true,
      };
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, { ...options, headers });

      // If 401, try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, { ...options, headers });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error: errorData.detail || errorData.message || `Error ${response.status}`,
          status: response.status,
        };
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return { status: response.status };
      }

      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      this.isBackendReachable = false;
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
        isOffline: true,
      };
    }
  }

  // Auth methods
  async login(username: string, password: string) {
    const connected = await this.isConnected();
    if (!connected) {
      return { error: 'Backend not reachable', status: 0, isOffline: true };
    }

    const result = await this.request<TokenPair>('/api/auth/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (result.data) {
      this.saveTokens(result.data);
    }

    return result;
  }

  async logout() {
    this.clearTokens();
  }

  // Generic CRUD helpers
  async get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Reset connection state (useful for retry)
  resetConnectionState() {
    this.isBackendReachable = null;
  }
}

export const api = new ApiClient();
export default api;
