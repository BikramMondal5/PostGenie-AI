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
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        const decoded = verifyToken(token);
        const profiles = await profileRepo.getProfilesByUser(decoded.userId);

        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({ profiles }),
        };
    } catch (error) {
        console.error('List Profiles Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
