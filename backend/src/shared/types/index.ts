export type UserRole = 'student' | 'admin';

export type MessageRole = 'user' | 'assistant' | 'system';

export type AIProvider = 'bedrock' | 'openai' | 'gemini' | 'deepseek';

export type AIModel = 'nova-lite' | 'claude-3-5-sonnet';

export type RequestComplexity = 'simple' | 'complex';

export type CacheStatus = 'hit' | 'miss';

export type ConversationStatus = 'active' | 'archived';

export type KnowledgeCategory =
  | 'admissions'
  | 'registration'
  | 'tuition'
  | 'examinations'
  | 'calendar'
  | 'graduation'
  | 'scholarships'
  | 'campus-services'
  | 'general';

export interface PaginationParams {
  limit: number;
  lastEvaluatedKey?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  items: T[];
  count: number;
  lastEvaluatedKey?: Record<string, unknown> | undefined;
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

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  groups: string[];
}

export interface LambdaContext {
  requestId: string;
  functionName: string;
  remainingTimeMs: number;
}
