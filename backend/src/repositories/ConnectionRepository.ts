import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { PlatformConnection } from '../types';
import { encrypt, decrypt } from '../utils/encryption';

export class ConnectionRepository {
    /**
     * Create or update a platform connection
     * Encrypts sensitive tokens before storage
     */
    async upsertConnection(connection: Omit<PlatformConnection, 'connectionId' | 'connectedAt'>): Promise<PlatformConnection> {
        const connectionId = `${connection.userId}#${connection.platform}`;
        const now = new Date().toISOString();

        const fullConnection: PlatformConnection = {
            ...connection,
            connectionId,
            accessToken: encrypt(connection.accessToken),
            refreshToken: connection.refreshToken ? encrypt(connection.refreshToken) : '',
            connectedAt: now,
            isActive: true,
        };

        await dynamoDb.send(
            new PutCommand({
                TableName: TABLES.CONNECTIONS,
                Item: fullConnection,
            })
        );

        return fullConnection;
    }

    /**
     * Get all active connections for a user
     * Decrypts tokens before returning
     */
    async getConnectionsByUser(userId: string): Promise<PlatformConnection[]> {
        const result = await dynamoDb.send(
            new QueryCommand({
                TableName: TABLES.CONNECTIONS,
                IndexName: 'UserIdIndex',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId,
                },
            })
        );

        if (!result.Items) return [];

        return result.Items.map((item) => {
            const connection = item as PlatformConnection;
            return {
                ...connection,
                accessToken: decrypt(connection.accessToken),
                refreshToken: connection.refreshToken ? decrypt(connection.refreshToken) : '',
            };
        }) as PlatformConnection[];
    }

    /**
     * Get specific platform connection for a user
     */
    async getConnection(userId: string, platform: string): Promise<PlatformConnection | null> {
        const connectionId = `${userId}#${platform}`;

        const result = await dynamoDb.send(
            new GetCommand({
                TableName: TABLES.CONNECTIONS,
                Key: { connectionId },
            })
        );

        if (!result.Item) return null;

        const connection = result.Item as PlatformConnection;
        return {
            ...connection,
            accessToken: decrypt(connection.accessToken),
            refreshToken: connection.refreshToken ? decrypt(connection.refreshToken) : '',
        };
    }

    /**
     * Deactivate a connection
     */
    async deleteConnection(userId: string, platform: string): Promise<void> {
        const connectionId = `${userId}#${platform}`;

        await dynamoDb.send(
            new UpdateCommand({
                TableName: TABLES.CONNECTIONS,
                Key: { connectionId },
                UpdateExpression: 'SET isActive = :false',
                ExpressionAttributeValues: {
                    ':false': false,
                },
            })
        );
    }

    /**
     * Update connection active status
     */
    async updateConnectionStatus(userId: string, platform: string, isActive: boolean): Promise<void> {
        const connectionId = `${userId}#${platform}`;

        await dynamoDb.send(
            new UpdateCommand({
                TableName: TABLES.CONNECTIONS,
                Key: { connectionId },
                UpdateExpression: 'SET isActive = :isActive',
                ExpressionAttributeValues: {
                    ':isActive': isActive,
                },
            })
        );
    }
}
