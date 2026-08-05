import type { KnowledgeCategory } from '../../../shared/types/index.js';

export interface ResponseCache {
  cacheKey: string;
  question: string;
  answer: string;
  category: KnowledgeCategory;
  model: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: number;
}

export interface KnowledgeEntry {
  knowledgeId: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  feedbackId: string;
  userId: string;
  conversationId?: string;
  messageId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  category?: string;
  comment?: string;
  createdAt: string;
}

export interface AuditLog {
  auditId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  expiresAt: number;
}

export interface AnalyticsEvent {
  metricType: string;
  timestamp: string;
  date: string;
  value: number;
  metadata?: Record<string, unknown>;
  expiresAt?: number;
}
