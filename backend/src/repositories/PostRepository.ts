import { dynamoDb, TABLES } from '../config/dynamodb';
import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const POSTS_TABLE = TABLES.POSTS;

export interface ScheduledPost {
    postId: string;
    userId: string;
    platform: string;
    content: string;
    imageUrl?: string;
    scheduledAt: string; // ISO 8601 timestamp
    status: 'scheduled' | 'posted' | 'failed';
    createdAt: string;
    postedAt?: string;
    error?: string;
}

export class PostRepository {
    async createScheduledPost(post: Omit<ScheduledPost, 'postId' | 'createdAt' | 'status'>): Promise<ScheduledPost> {
        const postId = uuidv4();
        const createdAt = new Date().toISOString();

        const scheduledPost: ScheduledPost = {
            ...post,
            postId,
            createdAt,
            status: 'scheduled',
        };

        await dynamoDb.send(new PutCommand({
            TableName: POSTS_TABLE,
            Item: scheduledPost,
        }));

        return scheduledPost;
    }

    async getScheduledPostsByUser(userId: string): Promise<ScheduledPost[]> {
        const result = await dynamoDb.send(new QueryCommand({
            TableName: POSTS_TABLE,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        }));

        return (result.Items || []) as ScheduledPost[];
    }

    async getPostsDueForPosting(currentTime: string): Promise<ScheduledPost[]> {
        // This would need a GSI on scheduledAt for efficient querying
        // For now, we'll scan (not ideal for production)
        const result = await dynamoDb.send(new QueryCommand({
            TableName: POSTS_TABLE,
            IndexName: 'ScheduledAtIndex', // Assumes GSI exists
            KeyConditionExpression: '#status = :status AND scheduledAt <= :currentTime',
            ExpressionAttributeNames: {
                '#status': 'status',
            },
            ExpressionAttributeValues: {
                ':status': 'scheduled',
                ':currentTime': currentTime,
            },
        }));

        return (result.Items || []) as ScheduledPost[];
    }

    async updatePostStatus(postId: string, userId: string, status: 'posted' | 'failed', error?: string): Promise<void> {
        const updateExpression = error
            ? 'SET #status = :status, postedAt = :postedAt, #error = :error'
            : 'SET #status = :status, postedAt = :postedAt';

        const expressionAttributeValues: any = {
            ':status': status,
            ':postedAt': new Date().toISOString(),
        };

        if (error) {
            expressionAttributeValues[':error'] = error;
        }

        await dynamoDb.send(new UpdateCommand({
            TableName: POSTS_TABLE,
            Key: { postId },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: {
                '#status': 'status',
                ...(error ? { '#error': 'error' } : {}),
            },
            ExpressionAttributeValues: expressionAttributeValues,
        }));
    }

    async deletePost(postId: string, userId: string): Promise<void> {
        await dynamoDb.send(new DeleteCommand({
            TableName: POSTS_TABLE,
            Key: { postId },
        }));
    }
}
