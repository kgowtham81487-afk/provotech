let rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
rawBase = rawBase.trim().replace(/\/+$/, '');
if (!rawBase.endsWith('/api/v1')) {
  rawBase += '/api/v1';
}
export const API_BASE = rawBase;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: any;
  pagination?: any;
  error?: { message: string };
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('ees_access_token');
    if (storedToken) {
      headers.set('Authorization', `Bearer ${storedToken}`);
    }
  }

  // Ensure body is stringified if passed as an object
  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
    body = JSON.stringify(body);
  }

  try {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      ...options,
      headers,
      body,
      credentials: 'include',
    });

    // If 401 Unauthorized occurs on a non-auth endpoint, attempt one-time silent refresh via refresh token cookie
    if (res.status === 401 && !endpoint.includes('/auth/')) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshJson = await refreshRes.json();
          const newToken = refreshJson?.data?.accessToken || refreshJson?.accessToken;
          if (newToken) {
            if (typeof window !== 'undefined') {
              localStorage.setItem('ees_access_token', newToken);
            }
            headers.set('Authorization', `Bearer ${newToken}`);
            // Retry the original request
            res = await fetch(`${API_BASE}${cleanEndpoint}`, {
              ...options,
              headers,
              body,
              credentials: 'include',
            });
          }
        } else if (typeof window !== 'undefined') {
          localStorage.removeItem('ees_access_token');
        }
      } catch {
        // Silent refresh failed, proceed to return original 401 error
      }
    }

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        error: {
          message: json?.error?.message || json?.message || `Request failed with status ${res.status}`,
        },
      };
    }

    const pagination = json?.pagination || json?.meta;

    return {
      success: true,
      data: json?.data !== undefined ? json.data : json,
      meta: pagination,
      pagination,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: (err as Error).message || 'Network connection failed.',
      },
    };
  }
}

export const api = {
  get: async <T = any>(endpoint: string, options: { params?: Record<string, any>; headers?: HeadersInit } = {}): Promise<ApiResponse<T>> => {
    let url = endpoint;
    if (options.params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null && v !== '') {
          searchParams.append(k, String(v));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    const res = await apiRequest<T>(url, { method: 'GET', headers: options.headers });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  post: async <T = any>(endpoint: string, body?: any, options: { headers?: HeadersInit } = {}): Promise<ApiResponse<T>> => {
    const res = await apiRequest<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  put: async <T = any>(endpoint: string, body?: any, options: { headers?: HeadersInit } = {}): Promise<ApiResponse<T>> => {
    const res = await apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  patch: async <T = any>(endpoint: string, body?: any, options: { headers?: HeadersInit } = {}): Promise<ApiResponse<T>> => {
    const res = await apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  delete: async <T = any>(endpoint: string, options: { headers?: HeadersInit } = {}): Promise<ApiResponse<T>> => {
    const res = await apiRequest<T>(endpoint, {
      method: 'DELETE',
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
};
