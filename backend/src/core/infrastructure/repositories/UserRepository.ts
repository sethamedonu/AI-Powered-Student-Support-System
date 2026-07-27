import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient } from '../database/dynamoClient.js';
import type { IUserRepository } from '../../domain/repositories/index.js';
import type { User, CreateUserInput } from '../../domain/entities/User.js';
import type { PaginatedResult, PaginationParams } from '../../../shared/types/index.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { nowIso } from '../../../shared/utils/helpers.js';
import { env } from '../../../shared/types/env.js';

export class DynamoUserRepository implements IUserRepository {
  private readonly table = env.DYNAMODB_TABLE_USERS;

  async findById(userId: string): Promise<User | null> {
    const result = await docClient.send(
      new GetCommand({ TableName: this.table, Key: { userId } }),
    );
    return (result.Item as User) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email },
        Limit: 1,
      }),
    );
    return ((result.Items?.[0]) as User) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const now = nowIso();
    const user: User = {
      ...input,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: this.table,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)',
      }),
    );

    return user;
  }

  async update(userId: string, updates: Partial<User>): Promise<User> {
    const existing = await this.findById(userId);
    if (!existing) throw new NotFoundError('User');

    const updated: User = { ...existing, ...updates, updatedAt: nowIso() };

    await docClient.send(
      new PutCommand({ TableName: this.table, Item: updated }),
    );

    return updated;
  }

  async delete(userId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({ TableName: this.table, Key: { userId } }),
    );
  }

  async list(params: PaginationParams): Promise<PaginatedResult<User>> {
    const result = await docClient.send(
      new ScanCommand({
        TableName: this.table,
        Limit: params.limit,
        ExclusiveStartKey: params.lastEvaluatedKey as Record<string, unknown> | undefined,
      }),
    );

    return {
      items: (result.Items as User[]) ?? [],
      count: result.Count ?? 0,
      lastEvaluatedKey: result.LastEvaluatedKey as Record<string, unknown> | undefined,
    };
  }
}
