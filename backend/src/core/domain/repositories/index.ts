import type { User, CreateUserInput } from '../entities/User.js';
import type {
  Conversation,
  Message,
  CreateConversationInput,
  CreateMessageInput,
} from '../entities/Conversation.js';
import type {
  ResponseCache,
  KnowledgeEntry,
  Feedback,
  AuditLog,
  AnalyticsEvent,
} from '../entities/index.js';
import type { PaginatedResult, PaginationParams, KnowledgeCategory } from '../../../shared/types/index.js';

// ─── User Repository ──────────────────────────────────────────────────────────
export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: CreateUserInput): Promise<User>;
  update(userId: string, updates: Partial<User>): Promise<User>;
  delete(userId: string): Promise<void>;
  list(params: PaginationParams): Promise<PaginatedResult<User>>;
}

// ─── Conversation Repository ──────────────────────────────────────────────────
export interface IConversationRepository {
  findById(userId: string, conversationId: string): Promise<Conversation | null>;
  listByUser(userId: string, params: PaginationParams): Promise<PaginatedResult<Conversation>>;
  create(input: CreateConversationInput): Promise<Conversation>;
  update(userId: string, conversationId: string, updates: Partial<Conversation>): Promise<Conversation>;
  delete(userId: string, conversationId: string): Promise<void>;
}

// ─── Message Repository ───────────────────────────────────────────────────────
export interface IMessageRepository {
  findById(conversationId: string, messageId: string): Promise<Message | null>;
  listByConversation(conversationId: string, params: PaginationParams): Promise<PaginatedResult<Message>>;
  create(input: CreateMessageInput): Promise<Message>;
  deleteByConversation(conversationId: string): Promise<void>;
}

// ─── Cache Repository ─────────────────────────────────────────────────────────
export interface ICacheRepository {
  get(cacheKey: string): Promise<ResponseCache | null>;
  set(cache: Omit<ResponseCache, 'hitCount' | 'createdAt' | 'updatedAt'>): Promise<void>;
  incrementHitCount(cacheKey: string): Promise<void>;
  delete(cacheKey: string): Promise<void>;
}

// ─── Knowledge Repository ─────────────────────────────────────────────────────
export interface IKnowledgeRepository {
  findById(knowledgeId: string): Promise<KnowledgeEntry | null>;
  listByCategory(category: KnowledgeCategory, params: PaginationParams): Promise<PaginatedResult<KnowledgeEntry>>;
  search(query: string): Promise<KnowledgeEntry[]>;
  upsert(entry: Omit<KnowledgeEntry, 'createdAt' | 'updatedAt'>): Promise<KnowledgeEntry>;
  delete(knowledgeId: string): Promise<void>;
}

// ─── Feedback Repository ──────────────────────────────────────────────────────
export interface IFeedbackRepository {
  create(feedback: Omit<Feedback, 'createdAt'>): Promise<Feedback>;
  listByUser(userId: string, params: PaginationParams): Promise<PaginatedResult<Feedback>>;
}

// ─── Audit Repository ─────────────────────────────────────────────────────────
export interface IAuditRepository {
  log(entry: Omit<AuditLog, 'auditId' | 'timestamp' | 'expiresAt'>): Promise<void>;
  listByUser(userId: string, params: PaginationParams): Promise<PaginatedResult<AuditLog>>;
}

// ─── Analytics Repository ─────────────────────────────────────────────────────
export interface IAnalyticsRepository {
  record(event: Omit<AnalyticsEvent, 'timestamp' | 'date'>): Promise<void>;
  query(metricType: string, from: string, to: string): Promise<AnalyticsEvent[]>;
}
