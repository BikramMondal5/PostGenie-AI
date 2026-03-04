import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getOAuthSecrets } from '../../utils/secrets';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return {
                statusCode: 401,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Unauthorized: No token provided' }),
            };
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (e: any) {
            return {
                statusCode: 401,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: `Unauthorized: ${e.message}` }),
            };
        }

        const userId = decoded.userId;

        const platform = event.queryStringParameters?.platform;
        if (!platform) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Platform is required' }),
            };
        }

        const secrets = await getOAuthSecrets();
        const platformSecrets = secrets[platform];

        if (!platformSecrets || !platformSecrets.clientId) {
            return {
                statusCode: 500,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: `OAuth not configured for ${platform}` }),
            };
        }

        // Derive API Origin dynamically from the request headers to avoid circular dependency in CDK
        const protocol = event.headers['X-Forwarded-Proto'] || 'https';
        const host = event.headers.Host || event.headers.host;
        const stage = event.requestContext?.stage || 'prod';
        const apiOrigin = process.env.API_URL || `${protocol}://${host}/${stage}`;

        // Ensure no double slashes
        const normalizedApiOrigin = apiOrigin.endsWith('/') ? apiOrigin.slice(0, -1) : apiOrigin;
        const redirectUri = `${normalizedApiOrigin}/oauth/callback/${platform}`;

        const state = Buffer.from(JSON.stringify({ userId, platform })).toString('base64');

        let authUrl = '';

        switch (platform) {
            case 'linkedin':
                authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${platformSecrets.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20w_member_social%20email`;
                break;
            case 'twitter':
                authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${platformSecrets.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=tweet.read%20tweet.write%20users.read%20offline.access&code_challenge=challenge&code_challenge_method=plain`;
                break;
            case 'instagram':
                authUrl = `https://api.instagram.com/oauth/authorize?client_id=${platformSecrets.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish&response_type=code&state=${state}`;
                break;
            default:
                return {
                    statusCode: 400,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({ message: 'Unsupported platform' }),
                };
        }

        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({ authUrl }),
        };
    } catch (error) {
        console.error('Initiate OAuth Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
