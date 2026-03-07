import { PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, TABLES } from '../config/dynamodb';
import { VoiceProfile } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class VoiceProfileRepository {
    /**
     * Create a new voice profile
     */
    async createProfile(profile: Omit<VoiceProfile, 'profileId' | 'createdAt' | 'updatedAt'>): Promise<VoiceProfile> {
        const now = new Date().toISOString();

        // If newly created profile is active, deactivate others for same platform
        if (profile.isActive) {
            const allProfiles = await this.getProfilesByUserPlatform(profile.userId, profile.platform);
            for (const p of allProfiles) {
                if (p.isActive) {
                    await dynamoDb.send(
                        new PutCommand({
                            TableName: TABLES.VOICE_PROFILES,
                            Item: { ...p, isActive: false, updatedAt: now }
                        })
                    );
                }
            }
        }

        const fullProfile: VoiceProfile = {
            ...profile,
            profileId: uuidv4(),
            createdAt: now,
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
     * Toggle the active status of a profile and deactivate others for the same platform
     */
    async toggleActiveStatus(userId: string, profileId: string, platform: string, isActive: boolean): Promise<void> {
        // Find existing profile
        const result = await dynamoDb.send(
            new GetCommand({
                TableName: TABLES.VOICE_PROFILES,
                Key: { profileId }
            })
        );

        if (!result.Item) throw new Error("Profile not found");

        const profile = result.Item as VoiceProfile;

        // If we are activating this one, we should deactivate others for the same platform
        if (isActive) {
            const allProfiles = await this.getProfilesByUserPlatform(userId, platform);
            for (const p of allProfiles) {
                if (p.profileId !== profileId && p.isActive) {
                    await dynamoDb.send(
                        new PutCommand({
                            TableName: TABLES.VOICE_PROFILES,
                            Item: { ...p, isActive: false, updatedAt: new Date().toISOString() }
                        })
                    );
                }
            }
        }

        // Update the target profile
        await dynamoDb.send(
            new PutCommand({
                TableName: TABLES.VOICE_PROFILES,
                Item: { ...profile, isActive, updatedAt: new Date().toISOString() }
            })
        );
    }

    /**
     * Delete a profile
     */
    async deleteProfile(profileId: string): Promise<void> {
        await dynamoDb.send(
            new DeleteCommand({
                TableName: TABLES.VOICE_PROFILES,
                Key: { profileId },
            })
        );
    }

    /**
     * Get all profiles by user and platform
     */
    async getProfilesByUserPlatform(userId: string, platform: string): Promise<VoiceProfile[]> {
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

        return (result.Items || []) as VoiceProfile[];
    }

    /**
     * Get all profiles for a user
     */
    async getProfilesByUser(userId: string): Promise<VoiceProfile[]> {
        const result = await dynamoDb.send(
            new QueryCommand({
                TableName: TABLES.VOICE_PROFILES,
                IndexName: 'UserPlatformIndex',
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId,
                },
            })
        );

        return (result.Items || []) as VoiceProfile[];
    }
}
