import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';
import { PostRepository } from '../../repositories/PostRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

import { getOAuthSecrets } from '../../utils/secrets';

const connectionRepo = new ConnectionRepository();
const postRepo = new PostRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // 1. Auth check
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    // Standard CORS headers helper
    const getCorsHeaders = () => {
        const reqOrigin = event.headers.origin || event.headers.Origin || '*';
        return {
            'Access-Control-Allow-Origin': reqOrigin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        };
    };

    if (!token) {
        return {
            statusCode: 401,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Unauthorized' })
        };
    }

    let userId: string;
    try {
        const decoded = verifyToken(token);
        userId = decoded.userId;
    } catch (e) {
        return {
            statusCode: 401,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Invalid token' })
        };
    }

    // 2. Parse request
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Invalid JSON body' })
        };
    }

    const { platform, content, scheduledAt, imageUrl } = body;

    if (!platform || !content) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'platform and content are required' })
        };
    }

    // If scheduledAt is provided, store the post for later publishing
    if (scheduledAt) {
        const scheduledTime = new Date(scheduledAt);
        const now = new Date();

        if (scheduledTime <= now) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ success: false, message: 'Scheduled time must be in the future' })
            };
        }

        // Store scheduled post in DynamoDB
        try {
            const scheduledPost = await postRepo.createScheduledPost({
                userId,
                platform,
                content,
                imageUrl,
                scheduledAt: scheduledTime.toISOString(),
            });

            console.log(`Scheduled post created: ${scheduledPost.postId} for ${platform} at ${scheduledAt}`);

            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: true,
                    message: `Post scheduled for ${platform} at ${scheduledAt}`,
                    scheduled: true,
                    scheduledAt,
                    postId: scheduledPost.postId,
                })
            };
        } catch (error: any) {
            console.error('Failed to create scheduled post:', error);
            return {
                statusCode: 500,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    success: false,
                    message: 'Failed to schedule post',
                    error: error.message
                })
            };
        }
    }

    try {
        // 3. Get connection for the platform
        const connections = await connectionRepo.getConnectionsByUser(userId);
        const connection = connections.find(c => c.platform === (platform === 'twitter' ? 'twitter' : platform));

        if (!connection || !connection.isActive) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ success: false, message: `${platform} not connected` })
            };
        }

        // 4. Publish based on platform
        let publishResult;
        console.log(`Publishing to ${platform} for user ${userId}`);
        switch (platform) {
            case 'twitter':
                try {
                    publishResult = await publishToTwitter(connection.accessToken, content, imageUrl);
                } catch (twitterError: any) {
                    if (twitterError.response?.status === 401 && connection.refreshToken) {
                        console.log('Twitter token expired, attempting refresh...');
                        try {
                            const newAccessToken = await refreshTwitterToken(userId, connection.refreshToken);
                            publishResult = await publishToTwitter(newAccessToken, content, imageUrl);
                        } catch (refreshError: any) {
                            console.error('Twitter refresh failed:', refreshError.response?.data || refreshError.message);
                            throw twitterError; // throw original 401 if refresh fails
                        }
                    } else {
                        throw twitterError;
                    }
                }
                break;
            case 'linkedin':
                publishResult = await publishToLinkedIn(connection.accessToken, content, imageUrl);
                break;
            default:
                return {
                    statusCode: 400,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({ success: false, message: `Publishing for ${platform} not yet implemented` })
                };
        }

        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: true,
                message: `Successfully posted to ${platform}`,
                result: publishResult
            })
        };

    } catch (error: any) {
        const errorData = error.response?.data;
        const errorMessage = typeof errorData === 'object' ? JSON.stringify(errorData) : (errorData || error.message);
        console.error(`Publishing to ${platform} failed:`, errorMessage);

        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                success: false,
                message: `Failed to publish to ${platform}: ${errorMessage}`,
            })
        };
    }
};

async function refreshTwitterToken(userId: string, refreshToken: string) {
    const secrets = await getOAuthSecrets();
    const { clientId, clientSecret } = secrets.twitter;

    if (!clientId || !clientSecret) {
        throw new Error('Twitter OAuth secrets not configured');
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
        'https://api.twitter.com/2/oauth2/token',
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${basicAuth}`,
            },
        }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Save new tokens
    await connectionRepo.upsertConnection({
        userId,
        platform: 'twitter',
        accessToken: access_token,
        refreshToken: refresh_token || refreshToken,
        tokenExpiresAt: new Date(Date.now() + (expires_in || 7200) * 1000).toISOString(),
        isActive: true,
    });

    return access_token;
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
    try {
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
                // Continue with just text if image upload fails, or we could throw
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
    } catch (error: any) {
        throw error;
    }
}

async function publishToLinkedIn(accessToken: string, text: string, imageUrl?: string) {
    try {
        // 1. Get user profile
        console.log('LinkedIn: Fetching user profile...');
        const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!profileRes.data || !profileRes.data.sub) {
            throw new Error('Could not find LinkedIn user ID (sub)');
        }

        const userUrn = `urn:li:person:${profileRes.data.sub}`;
        console.log('LinkedIn: User URN:', userUrn);

        let imageUrn: string | null = null;

        if (imageUrl) {
            console.log('LinkedIn: Initializing image upload...');
            try {
                const { buffer } = await getImageBuffer(imageUrl);

                // Initialize upload via v2/images API (newer, works with v2/posts)
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

                console.log('LinkedIn: Uploading image to pre-signed URL...');

                // Important: NO Authorization header for the pre-signed URL
                await axios.put(uploadUrl, buffer, {
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    }
                });

                console.log('LinkedIn: Image uploaded successfully, imageUrn:', imageUrn);
            } catch (uploadError: any) {
                console.error('LinkedIn media upload failed:', uploadError.response?.data || uploadError.message);
                // Continue with just text if image fails
                imageUrn = null;
            }
        }

        // 2. Create the post
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

        console.log('LinkedIn: Creating post...');
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
        console.error('LinkedIn publishToLinkedIn function error:', error.response?.data || error.message);
        throw error;
    }
}

