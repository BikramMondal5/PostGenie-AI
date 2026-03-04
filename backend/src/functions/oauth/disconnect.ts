import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

const connectionRepo = new ConnectionRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return {
                statusCode: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ message: 'Unauthorized' }),
            };
        }

        const decoded = verifyToken(token);
        const userId = decoded.userId;

        const platform = event.pathParameters?.platform;
        if (!platform) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Platform is required' }),
            };
        }

        await connectionRepo.deleteConnection(userId, platform);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: `Disconnected from ${platform}` }),
        };
    } catch (error) {
        console.error('Delete Connection Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
