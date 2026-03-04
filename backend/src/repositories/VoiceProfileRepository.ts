import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { VoiceProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class VoiceProfileRepository {
    /**
     * Create or update a voice profile
     */
    async upsertProfile(profile: Omit<VoiceProfile, 'profileId' | 'createdAt' | 'updatedAt'>): Promise<VoiceProfile> {
        const now = new Date().toISOString();

        // Check if profile exists for user/platform to keep the same profileId
        const existing = await this.getProfileByUserPlatform(profile.userId, profile.platform);

        const fullProfile: VoiceProfile = {
            ...profile,
            profileId: existing ? existing.profileId : uuidv4(),
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now,
        };

        await dynamoDb.send(
            new PutCommand({
                TableName: TABLES.VOICE_PROFILES,
                Item: fullProfile,
            })
        );

        return fullProfile;
    }

    /**
     * Get specific profile by user and platform
     */
    async getProfileByUserPlatform(userId: string, platform: string): Promise<VoiceProfile | null> {
        const result = await dynamoDb.send(
            new QueryCommand({
                TableName: TABLES.VOICE_PROFILES,
                IndexName: 'UserPlatformIndex',
                KeyConditionExpression: 'userId = :userId AND platform = :platform',
                ExpressionAttributeValues: {
                    ':userId': userId,
                    ':platform': platform,
                },
            })
        );

        if (!result.Items || result.Items.length === 0) return null;
        return result.Items[0] as VoiceProfile;
    }

    /**
     * Get all profiles for a user
     */
    async getProfilesByUser(userId: string): Promise<VoiceProfile[]> {
        const result = await dynamoDb.send(
            new QueryCommand({
                TableName: TABLES.VOICE_PROFILES,
                IndexName: 'UserPlatformIndex', // Though it's called UserPlatformIndex, partition key is userId
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId,
                },
            })
        );

        return (result.Items || []) as VoiceProfile[];
    }
}
