import { ScheduledEvent } from 'aws-lambda';
import { PostRepository, ScheduledPost } from '../../repositories/PostRepository';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';
import axios from 'axios';
import { getOAuthSecrets } from '../../utils/secrets';

const postRepo = new PostRepository();
const connectionRepo = new ConnectionRepository();

/**
 * This Lambda function runs every minute (via EventBridge rule)
 * to check for scheduled posts that are due and publish them
 */
export const handler = async (event: ScheduledEvent): Promise<void> => {
    console.log('Scheduled post checker running at:', new Date().toISOString());

    try {
        // Get all posts that are due for posting
        const currentTime = new Date().toISOString();
        const duePosts = await postRepo.getPostsDueForPosting(currentTime);

        console.log(`Found ${duePosts.length} posts due for posting`);

        // Process each post
        for (const post of duePosts) {
            try {
                await publishScheduledPost(post);
                await postRepo.updatePostStatus(post.postId, post.userId, 'posted');
                console.log(`Successfully posted scheduled post ${post.postId} to ${post.platform}`);
            } catch (error: any) {
                console.error(`Failed to post ${post.postId}:`, error.message);
                await postRepo.updatePostStatus(post.postId, post.userId, 'failed', error.message);
            }
        }
    } catch (error: any) {
        console.error('Scheduler error:', error);
    }
};

async function publishScheduledPost(post: ScheduledPost): Promise<void> {
    // Get user's connection for the platform
    const connections = await connectionRepo.getConnectionsByUser(post.userId);
    const connection = connections.find(c => c.platform === (post.platform === 'twitter' ? 'twitter' : post.platform));

    if (!connection || !connection.isActive) {
        throw new Error(`${post.platform} not connected for user ${post.userId}`);
    }

    // Publish based on platform
    switch (post.platform) {
        case 'twitter':
            await publishToTwitter(connection.accessToken, post.content);
            break;
        case 'linkedin':
            await publishToLinkedIn(connection.accessToken, post.content);
            break;
        case 'instagram':
            throw new Error('Instagram posting not yet implemented');
        default:
            throw new Error(`Unknown platform: ${post.platform}`);
    }
}

async function publishToTwitter(accessToken: string, text: string) {
    const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        { text },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        }
    );
    return response.data;
}

async function publishToLinkedIn(accessToken: string, text: string) {
    // Get user profile
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userUrn = `urn:li:person:${profileRes.data.sub}`;

    // Post share
    const response = await axios.post(
        'https://api.linkedin.com/v2/posts',
        {
            author: userUrn,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: 'PUBLISHED'
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        }
    );
    return response.data;
}
