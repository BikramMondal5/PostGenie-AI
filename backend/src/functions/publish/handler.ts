import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

import { getOAuthSecrets } from '../../utils/secrets';

const connectionRepo = new ConnectionRepository();

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

    const { platform, content } = body;

    if (!platform || !content) {
        return {
            statusCode: 400,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'platform and content are required' })
        };
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
                    publishResult = await publishToTwitter(connection.accessToken, content);
                } catch (twitterError: any) {
                    if (twitterError.response?.status === 401 && connection.refreshToken) {
                        console.log('Twitter token expired, attempting refresh...');
                        try {
                            const newAccessToken = await refreshTwitterToken(userId, connection.refreshToken);
                            publishResult = await publishToTwitter(newAccessToken, content);
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
                // Need to get urn from connection or API
                publishResult = await publishToLinkedIn(connection.accessToken, content);
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

async function publishToTwitter(accessToken: string, text: string) {
    try {
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
    } catch (error: any) {
        // Handle specifically if we want to retry outside
        throw error;
    }
}

async function publishToLinkedIn(accessToken: string, text: string) {
    // 1. Get user profile to find their URN
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    // In OpenID Connect userinfo, sub is the unique identifier
    const userUrn = `urn:li:person:${profileRes.data.sub}`;

    // 2. Post share
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
