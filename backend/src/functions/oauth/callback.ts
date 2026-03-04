import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import axios from 'axios';
import { getOAuthSecrets } from '../../utils/secrets';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';

const connectionRepo = new ConnectionRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const platform = event.pathParameters?.platform;
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!code || !state || !platform) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required parameters' }),
        };
    }

    try {
        // 1. Decode state to get userId
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        const { userId } = decodedState;

        // 2. Get secrets
        const secrets = await getOAuthSecrets();
        const platformSecrets = secrets[platform];

        const protocol = event.headers['X-Forwarded-Proto'] || 'https';
        const host = event.headers.Host || event.headers.host;
        const stage = event.requestContext?.stage || 'prod';
        const origin = process.env.API_URL || `${protocol}://${host}/${stage}`;
        const redirectUri = `${origin}/oauth/callback/${platform}`;

        let tokenEndpoint = '';
        let payload: any = {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: platformSecrets.clientId,
            client_secret: platformSecrets.clientSecret,
        };

        let axiosOptions: any = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        switch (platform) {
            case 'linkedin':
                tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
                break;
            case 'twitter':
                tokenEndpoint = 'https://api.twitter.com/2/oauth2/token';
                payload.code_verifier = 'challenge';
                // Twitter requires Basic Auth credentials for OAuth 2.0 PKCE flow
                const basicAuth = Buffer.from(`${platformSecrets.clientId}:${platformSecrets.clientSecret}`).toString('base64');
                axiosOptions.headers['Authorization'] = `Basic ${basicAuth}`;
                // Remove client secret from body, as it must go in header
                delete payload.client_secret;
                delete payload.client_id; // Usually also deleted when using Basic auth, but Twitter sometimes accepts it. Let's send in Basic.
                break;
            case 'instagram':
                tokenEndpoint = 'https://api.instagram.com/oauth/access_token';
                break;
            default:
                throw new Error('Unsupported platform');
        }

        // 3. Exchange code for token
        const response = await axios.post(tokenEndpoint, new URLSearchParams(payload).toString(), axiosOptions);

        const { access_token, refresh_token, expires_in } = response.data;

        // 4. Save connection
        await connectionRepo.upsertConnection({
            userId,
            platform: platform as any,
            accessToken: access_token,
            refreshToken: refresh_token || '',
            tokenExpiresAt: expires_in ? new Date(Date.now() + expires_in * 1000).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 year if not provided
            isActive: true,
        });

        // 5. Redirect back to frontend
        return {
            statusCode: 302,
            headers: {
                Location: `${frontendUrl}/settings/integrations?success=true&platform=${platform}`,
            },
            body: '',
        };
    } catch (error: any) {
        console.error('OAuth Callback Error:', error.response?.data || error.message);
        return {
            statusCode: 302,
            headers: {
                Location: `${frontendUrl}/settings/integrations?error=oauth_failed&platform=${platform}`,
            },
            body: '',
        };
    }
};
