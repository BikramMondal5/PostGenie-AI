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
            await publishToTwitter(connection.accessToken, post.content, post.imageUrl);
            break;
        case 'linkedin':
            await publishToLinkedIn(connection.accessToken, post.content, post.imageUrl);
            break;
        case 'instagram':
            throw new Error('Instagram posting not yet implemented');
        default:
            throw new Error(`Unknown platform: ${post.platform}`);
    }
}

async function getImageBuffer(imageUrl: string): Promise<{ buffer: Buffer, mime: string }> {
    if (imageUrl.startsWith('data:image')) {
        const mime = imageUrl.match(/data:([^;]+);base64/)?.[1] || 'image/png';
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        return { buffer: Buffer.from(base64Data, 'base64'), mime };
    } else {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const mime = response.headers['content-type'] || 'image/png';
        return { buffer: Buffer.from(response.data), mime };
    }
}

async function publishToTwitter(accessToken: string, text: string, imageUrl?: string) {
    let mediaIds: string[] = [];

    if (imageUrl) {
        console.log('Twitter: Processing image...');
        try {
            const { buffer } = await getImageBuffer(imageUrl);
            const base64Data = buffer.toString('base64');

            // Twitter v1.1 Media Upload
            const uploadRes = await axios.post(
                'https://upload.twitter.com/1.1/media/upload.json',
                new URLSearchParams({ media_data: base64Data }).toString(),
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                }
            );

            if (uploadRes.data && uploadRes.data.media_id_string) {
                mediaIds.push(uploadRes.data.media_id_string);
                console.log('Twitter: Image uploaded successfully, media_id:', uploadRes.data.media_id_string);
            }
        } catch (uploadError: any) {
            console.error('Twitter media upload failed:', uploadError.response?.data || uploadError.message);
        }
    }

    const tweetPayload: any = { text };
    if (mediaIds.length > 0) {
        tweetPayload.media = { media_ids: mediaIds };
    }

    const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        tweetPayload,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        }
    );
    return response.data;
}

async function publishToLinkedIn(accessToken: string, text: string, imageUrl?: string) {
    try {
        // Get user profile
        const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!profileRes.data || !profileRes.data.sub) {
            throw new Error('Could not find LinkedIn user ID (sub)');
        }

        const userUrn = `urn:li:person:${profileRes.data.sub}`;

        let imageUrn: string | null = null;

        if (imageUrl) {
            console.log('LinkedIn: Initializing image upload...');
            try {
                const { buffer } = await getImageBuffer(imageUrl);

                // Register upload via v2/images API
                const registerRes = await axios.post(
                    'https://api.linkedin.com/v2/images?action=initializeUpload',
                    {
                        initializeUploadRequest: {
                            owner: userUrn
                        }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                const uploadUrl = registerRes.data.value.uploadUrl;
                imageUrn = registerRes.data.value.image;

                console.log('LinkedIn: Uploading binary data...');

                await axios.put(uploadUrl, buffer, {
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    }
                });

                console.log('LinkedIn: Image uploaded successfully, imageUrn:', imageUrn);
            } catch (uploadError: any) {
                console.error('LinkedIn media upload failed:', uploadError.response?.data || uploadError.message);
                imageUrn = null;
            }
        }

        // Post share
        const postPayload: any = {
            author: userUrn,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: 'PUBLISHED'
        };

        if (imageUrn) {
            postPayload.content = {
                media: {
                    title: 'Post Image',
                    id: imageUrn
                }
            };
        }

        const response = await axios.post(
            'https://api.linkedin.com/v2/posts',
            postPayload,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            }
        );
        return response.data;
    } catch (error: any) {
        console.error('LinkedIn scheduler direct error:', error.response?.data || error.message);
        throw error;
    }
}

