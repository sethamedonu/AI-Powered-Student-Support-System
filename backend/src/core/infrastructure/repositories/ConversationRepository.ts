import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../database/dynamoClient.js';
import type {
  IConversationRepository,
  IMessageRepository,
} from '../../domain/repositories/index.js';
import type {
  Conversation,
  Message,
  CreateConversationInput,
  CreateMessageInput,
} from '../../domain/entities/Conversation.js';
import type { PaginatedResult, PaginationParams } from '../../../shared/types/index.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { nowIso, ttlDays } from '../../../shared/utils/helpers.js';
import { env } from '../../../shared/types/env.js';

export class DynamoConversationRepository implements IConversationRepository {
  private readonly table = env.DYNAMODB_TABLE_CONVERSATIONS;

  async findById(userId: string, conversationId: string): Promise<Conversation | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: this.table, Key: { userId, conversationId } }),
    );
    return (result.Item ?? null) as Conversation | null;
  }

  async listByUser(userId: string, params: PaginationParams): Promise<PaginatedResult<Conversation>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
        ScanIndexForward: false,
        Limit: params.limit,
        ExclusiveStartKey: params.lastEvaluatedKey,
      }),
    );

    // Sort by lastMessageAt descending to show most recent conversations first
    const items = (result.Items ?? []) as Conversation[];
    items.sort((a, b) => {
      const timeA = new Date(a.lastMessageAt).getTime();
      const timeB = new Date(b.lastMessageAt).getTime();
      return timeB - timeA; // Descending order (newest first)
    });

    return {
      items,
      count: result.Count ?? 0,
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async create(input: CreateConversationInput): Promise<Conversation> {
    const now = nowIso();
    const conversation: Conversation = {
      ...input,
      status: 'active',
      messageCount: 0,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
      expiresAt: ttlDays(90),
    };

    await docClient.send(new PutCommand({ TableName: this.table, Item: conversation }));
    return conversation;
  }

  async update(
    userId: string,
    conversationId: string,
    updates: Partial<Conversation>,
  ): Promise<Conversation> {
    const existing = await this.findById(userId, conversationId);
    if (!existing) throw new NotFoundError('Conversation');

    const updated: Conversation = { ...existing, ...updates, updatedAt: nowIso() };
    await docClient.send(new PutCommand({ TableName: this.table, Item: updated }));
    return updated;
  }

  async delete(userId: string, conversationId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({ TableName: this.table, Key: { userId, conversationId } }),
    );
  }
}

export class DynamoMessageRepository implements IMessageRepository {
  private readonly table = env.DYNAMODB_TABLE_MESSAGES;

  async findById(conversationId: string, messageId: string): Promise<Message | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: this.table, Key: { conversationId, messageId } }),
    );
    return (result.Item ?? null) as Message | null;
  }

  async listByConversation(
    conversationId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Message>> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'conversationId = :cid',
        ExpressionAttributeValues: { ':cid': conversationId },
        ScanIndexForward: true,
        Limit: params.limit,
        ExclusiveStartKey: params.lastEvaluatedKey,
      }),
    );

    return {
      items: (result.Items ?? []) as Message[],
      count: result.Count ?? 0,
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }

  async create(input: CreateMessageInput): Promise<Message> {
    const message: Message = {
      ...input,
      createdAt: nowIso(),
      expiresAt: ttlDays(90),
    };

    await docClient.send(new PutCommand({ TableName: this.table, Item: message }));
    return message;
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    const messages = await this.listByConversation(conversationId, { limit: 1000 });

    await Promise.all(
      messages.items.map((msg) =>
        docClient.send(
          new DeleteCommand({
            TableName: this.table,
            Key: { conversationId, messageId: msg.messageId },
          }),
        ),
      ),
    );
  }
}
