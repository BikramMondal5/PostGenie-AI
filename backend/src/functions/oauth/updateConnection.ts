import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

const connectionRepo = new ConnectionRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const getCorsHeaders = () => {
        const reqOrigin = event.headers.origin || event.headers.Origin || '*';
        return {
            'Access-Control-Allow-Origin': reqOrigin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
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
        const userId = decoded.userId;

        const platform = event.pathParameters?.platform;
        if (!platform) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Platform is required' }),
            };
        }

        const body = JSON.parse(event.body || '{}');
        const { isActive } = body;

        if (typeof isActive !== 'boolean') {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'isActive must be a boolean' }),
            };
        }

        await connectionRepo.updateConnectionStatus(userId, platform, isActive);

        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Connection status updated successfully' }),
        };
    } catch (error) {
        console.error('Update Connection Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
