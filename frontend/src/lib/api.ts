import type {
  ApiResponse,
  LoginResponse,
  SendMessageResponse,
  Conversation,
  Message,
  PaginatedResult,
  User,
} from './types';

const API_BASE = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000';

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? 'An unexpected error occurred',
      res.status,
    );
  }

  return json.data as T;
}

// ─── Token helpers ────────────────────────────────────────────────────────────
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function saveTokens(tokens: {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('idToken', tokens.idToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function saveUser(user: User): void {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: {
    email: string;
    password: string;
    givenName: string;
    familyName: string;
    studentId?: string;
  }) => request<{ userId: string; email: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }),

  login: (body: { email: string; password: string }) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verify: (body: { email: string; code: string }) =>
    request<{ verified: boolean }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  forgotPassword: (body: { email: string }) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    request<{ reset: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  refresh: () =>
    request<{ accessToken: string; idToken: string; expiresIn: number }>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }) },
    ),
};

// ─── Chat API ─────────────────────────────────────────────────────────────────
export const chatApi = {
  sendMessage: (body: {
    message: string;
    conversationId?: string;
    category?: string;
  }) => request<SendMessageResponse>('/chat/send', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
};

// ─── Conversations API ────────────────────────────────────────────────────────
export const conversationsApi = {
  list: (limit = 20) =>
    request<PaginatedResult<Conversation>>(`/conversations?limit=${limit}`),

  get: (conversationId: string, limit = 50) =>
    request<{ conversation: Conversation; messages: PaginatedResult<Message> }>(
      `/conversations/${conversationId}?limit=${limit}`,
    ),

  delete: (conversationId: string) =>
    request<{ deleted: boolean; conversationId: string }>(
      `/conversations/${conversationId}`,
      { method: 'DELETE' },
    ),
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
  getStats: () =>
    request<{
      totalUsers: number;
      totalConversations: number;
      totalMessages: number;
      cacheHitRate: number;
      avgLatencyMs: number;
      activeToday: number;
    }>('/admin/stats'),

  listUsers: (limit = 20) =>
    request<PaginatedResult<User>>(`/admin/users?limit=${limit}`),

  listFeedback: (limit = 20) =>
    request<PaginatedResult<{
      feedbackId: string;
      rating: number;
      category: string;
      comment: string;
      createdAt: string;
    }>>(`/admin/feedback?limit=${limit}`),

  getAnalytics: (period: 'day' | 'week' | 'month' = 'week') =>
    request<{
      period: string;
      metrics: { date: string; messages: number; cacheHits: number; aiCalls: number }[];
      topCategories: { category: string; count: number }[];
      modelUsage: { model: string; count: number }[];
    }>(`/admin/analytics?period=${period}`),
};

// ─── Feedback API ────────────────────────────────────────────────────────────
export const feedbackApi = {
  submit: (body: {
    rating: number;
    category: string;
    comment: string;
    conversationId?: string;
  }) =>
    request<{ feedbackId: string }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export { ApiError };
