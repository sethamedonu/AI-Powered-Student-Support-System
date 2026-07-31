export type UserRole = "student" | "admin";
export type MessageRole = "user" | "assistant";
export type CacheStatus = "hit" | "miss";
export type ConversationStatus = "active" | "archived";

export type KnowledgeCategory =
  | "admissions"
  | "registration"
  | "tuition"
  | "examinations"
  | "calendar"
  | "graduation"
  | "scholarships"
  | "campus-services"
  | "general";

export interface User {
  userId: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  studentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  userId: string;
  conversationId: string;
  title: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  conversationId: string;
  messageId: string;
  role: MessageRole;
  content: string;
  model?: string;
  cacheStatus?: CacheStatus;
  tokensUsed?: number;
  latencyMs?: number;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface SendMessageResponse {
  conversationId: string;
  messageId: string;
  answer: string;
  model: string;
  cacheStatus: CacheStatus;
  tokensUsed: number;
  latencyMs: number;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}
