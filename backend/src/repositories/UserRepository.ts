import { PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { User } from '../types';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;

export class UserRepository {
  /**
   * Create a new user with hashed password
   */
  async createUser(email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();

    const user: User = {
      userId: uuidv4(),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: now,
      lastLoginAt: now,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: TABLES.USERS,
        Item: user,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );

    return user;
  }

  /**
   * Get user by userId
   */
  async getUserById(userId: string): Promise<User | null> {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: TABLES.USERS,
        Key: { userId },
      })
    );

    return (result.Item as User) || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: TABLES.USERS,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase(),
        },
      })
    );

    if (result.Items && result.Items.length > 0) {
      return result.Items[0] as User;
    }

    return null;
  }

  /**
   * Verify password against stored hash
   */
  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: 'SET lastLoginAt = :now',
        ExpressionAttributeValues: {
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: 'SET passwordHash = :hash',
        ExpressionAttributeValues: {
          ':hash': passwordHash,
        },
      })
    );
  }

  /**
   * Check if email already exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    return user !== null;
  }

  /**
   * Update user profile fields (displayName, avatarUrl, bio, timezone)
   */
  async updateProfile(userId: string, updates: { displayName?: string; avatarUrl?: string; bio?: string; timezone?: string }): Promise<void> {
    if (Object.keys(updates).length === 0) return;

    const setParts: string[] = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    if (updates.displayName !== undefined) {
      setParts.push('#displayName = :displayName');
      expressionValues[':displayName'] = updates.displayName;
      expressionNames['#displayName'] = 'displayName';
    }
    if (updates.avatarUrl !== undefined) {
      setParts.push('#avatarUrl = :avatarUrl');
      expressionValues[':avatarUrl'] = updates.avatarUrl;
      expressionNames['#avatarUrl'] = 'avatarUrl';
    }
    if (updates.bio !== undefined) {
      setParts.push('#bio = :bio');
      expressionValues[':bio'] = updates.bio;
      expressionNames['#bio'] = 'bio';
    }
    if (updates.timezone !== undefined) {
      setParts.push('#timezone = :timezone');
      expressionValues[':timezone'] = updates.timezone;
      expressionNames['#timezone'] = 'timezone';
    }

    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: `SET ${setParts.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
      })
    );
  }

  /**
   * Delete a user by userId
   */
  async deleteUser(userId: string): Promise<void> {
    await dynamoDb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: 'SET isDeleted = :deleted',
        ExpressionAttributeValues: {
          ':deleted': true,
        },
      })
    );
    // Alternatively, fully delete:
    /*
    await dynamoDb.send(
      new DeleteCommand({
        TableName: TABLES.USERS,
        Key: { userId },
      })
    );
    */
  }
}
