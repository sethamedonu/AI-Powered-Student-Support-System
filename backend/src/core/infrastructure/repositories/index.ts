import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../database/dynamoClient.js';
import type {
  ICacheRepository,
  IKnowledgeRepository,
  IFeedbackRepository,
  IAuditRepository,
  IAnalyticsRepository,
} from '../../domain/repositories/index.js';
import type {
  ResponseCache,
  KnowledgeEntry,
  Feedback,
  AuditLog,
  AnalyticsEvent,
} from '../../domain/entities/index.js';
import type { PaginatedResult, PaginationParams, KnowledgeCategory } from '../../../shared/types/index.js';
import { generateId, nowIso, ttlDays, ttlHours } from '../../../shared/utils/helpers.js';
import { env } from '../../../shared/types/env.js';

// ─── Cache Repository ─────────────────────────────────────────────────────────
export class DynamoCacheRepository implements ICacheRepository {
  private readonly table = env.DYNAMODB_TABLE_CACHE;

  async get(cacheKey: string): Promise<ResponseCache | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: this.table, Key: { cacheKey } }),
    );
    return (result.Item as ResponseCache) ?? null;
  }

  async set(cache: Omit<ResponseCache, 'hitCount' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = nowIso();
    await docClient.send(
      new PutCommand({
        TableName: this.table,
        Item: { ...cache, hitCount: 0, createdAt: now, updatedAt: now },
      }),
    );
  }

  async incrementHitCount(cacheKey: string): Promise<void> {
    await docClient.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { cacheKey },
        UpdateExpression: 'ADD hitCount :inc SET updatedAt = :now',
        ExpressionAttributeValues: { ':inc': 1, ':now': nowIso() },
      }),
    );
  }

  async delete(cacheKey: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({ TableName: this.table, Key: { cacheKey } }),
    );
  }
}

// ─── Knowledge Repository ─────────────────────────────────────────────────────
export class DynamoKnowledgeRepository implements IKnowledgeRepository {
  private readonly table = env.DYNAMODB_TABLE_KNOWLEDGE;

  async findById(knowledgeId: string): Promise<KnowledgeEntry | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: this.table, Key: { knowledgeId } }),
    );
    return (result.Item as KnowledgeEntry) ?? null;
  }

  async listByCategory(
    category: KnowledgeCategory,
    params: PaginationParams,
  ): Promise<PaginatedResult<KnowledgeEntry>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'category-updatedAt-index',
        KeyConditionExpression: 'category = :cat',
        ExpressionAttributeValues: { ':cat': category },
        Limit: params.limit,
        ExclusiveStartKey: params.lastEvaluatedKey as Record<string, unknown> | undefined,
      }),
    );

    return {
      items: (result.Items as KnowledgeEntry[]) ?? [],
      count: result.Count ?? 0,
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async search(query: string): Promise<KnowledgeEntry[]> {
    const terms = query.toLowerCase().split(' ').filter(Boolean);
    const result = await docClient.send(
      new ScanCommand({
        TableName: this.table,
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: { ':active': true },
      }),
    );

    const entries = (result.Items as KnowledgeEntry[]) ?? [];
    return entries.filter((entry) => {
      const searchable = `${entry.title} ${entry.content} ${entry.keywords.join(' ')}`.toLowerCase();
      return terms.some((term) => searchable.includes(term));
    });
  }

  async upsert(entry: Omit<KnowledgeEntry, 'createdAt' | 'updatedAt'>): Promise<KnowledgeEntry> {
    const now = nowIso();
    const existing = await this.findById(entry.knowledgeId);
    const full: KnowledgeEntry = {
      ...entry,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await docClient.send(new PutCommand({ TableName: this.table, Item: full }));
    return full;
  }

  async delete(knowledgeId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({ TableName: this.table, Key: { knowledgeId } }),
    );
  }
}

// ─── Feedback Repository ──────────────────────────────────────────────────────
export class DynamoFeedbackRepository implements IFeedbackRepository {
  private readonly table = env.DYNAMODB_TABLE_FEEDBACK;

  async create(feedback: Omit<Feedback, 'createdAt'>): Promise<Feedback> {
    const full: Feedback = { ...feedback, createdAt: nowIso() };
    await docClient.send(new PutCommand({ TableName: this.table, Item: full }));
    return full;
  }

  async listByUser(userId: string, params: PaginationParams): Promise<PaginatedResult<Feedback>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
        Limit: params.limit,
        ExclusiveStartKey: params.lastEvaluatedKey as Record<string, unknown> | undefined,
      }),
    );

    return {
      items: (result.Items as Feedback[]) ?? [],
      count: result.Count ?? 0,
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }
}

// ─── Audit Repository ─────────────────────────────────────────────────────────
export class DynamoAuditRepository implements IAuditRepository {
  private readonly table = env.DYNAMODB_TABLE_AUDIT;

  async log(entry: Omit<AuditLog, 'auditId' | 'timestamp' | 'expiresAt'>): Promise<void> {
    const full: AuditLog = {
      ...entry,
      auditId: generateId(),
      timestamp: nowIso(),
      expiresAt: ttlDays(365),
    };
    await docClient.send(new PutCommand({ TableName: this.table, Item: full }));
  }

  async listByUser(userId: string, params: PaginationParams): Promise<PaginatedResult<AuditLog>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'userId-timestamp-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
        Limit: params.limit,
        ExclusiveStartKey: params.lastEvaluatedKey as Record<string, unknown> | undefined,
      }),
    );

    return {
      items: (result.Items as AuditLog[]) ?? [],
      count: result.Count ?? 0,
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }
}

// ─── Analytics Repository ─────────────────────────────────────────────────────
export class DynamoAnalyticsRepository implements IAnalyticsRepository {
  private readonly table = env.DYNAMODB_TABLE_ANALYTICS;

  async record(event: Omit<AnalyticsEvent, 'timestamp' | 'date'>): Promise<void> {
    const now = new Date();
    const full: AnalyticsEvent = {
      ...event,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0] ?? now.toISOString(),
      expiresAt: ttlDays(90),
    };
    await docClient.send(new PutCommand({ TableName: this.table, Item: full }));
  }

  async query(metricType: string, from: string, to: string): Promise<AnalyticsEvent[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'metricType = :type AND #ts BETWEEN :from AND :to',
        ExpressionAttributeNames: { '#ts': 'timestamp' },
        ExpressionAttributeValues: { ':type': metricType, ':from': from, ':to': to },
      }),
    );
    return (result.Items as AnalyticsEvent[]) ?? [];
  }
}
