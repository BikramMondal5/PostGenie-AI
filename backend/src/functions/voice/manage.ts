import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VoiceProfileRepository } from '../../repositories/VoiceProfileRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

const profileRepo = new VoiceProfileRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const getCorsHeaders = () => {
        const reqOrigin = event.headers.origin || event.headers.Origin || '*';
        return {
            'Access-Control-Allow-Origin': reqOrigin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PATCH,DELETE',
        };
    };

    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return {
                statusCode: 401,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        const decoded = verifyToken(token);
        const { userId } = decoded;

        const profileId = event.pathParameters?.profileId;
        if (!profileId) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Profile ID is required' }),
            };
        }

        const method = event.httpMethod;

        if (method === 'PATCH') {
            const body = JSON.parse(event.body || '{}');
            const { isActive, platform } = body;

            if (isActive === undefined || !platform) {
                return {
                    statusCode: 400,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({ message: 'isActive and platform are required' }),
                };
            }

            await profileRepo.toggleActiveStatus(userId, profileId, platform, isActive);

            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Profile status updated successfully' }),
            };
        } else if (method === 'DELETE') {
            await profileRepo.deleteProfile(profileId);

            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Profile deleted successfully' }),
            };
        }

        return {
            statusCode: 405,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    } catch (error: any) {
        console.error('Manage Profile Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: error.message || 'Internal server error' }),
        };
    }
};
