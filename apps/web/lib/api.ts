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
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      ...options,
      headers,
      body,
      credentials: 'include',
    });

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
  get: async (endpoint: string, options: { params?: Record<string, any>; headers?: HeadersInit } = {}) => {
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
    const res = await apiRequest(url, { method: 'GET', headers: options.headers });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  post: async (endpoint: string, body?: any, options: { headers?: HeadersInit } = {}) => {
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  patch: async (endpoint: string, body?: any, options: { headers?: HeadersInit } = {}) => {
    const res = await apiRequest(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
  delete: async (endpoint: string, options: { headers?: HeadersInit } = {}) => {
    const res = await apiRequest(endpoint, {
      method: 'DELETE',
      headers: options.headers,
    });
    if (!res.success) throw new Error(res.error?.message || 'Request failed');
    return res;
  },
};
