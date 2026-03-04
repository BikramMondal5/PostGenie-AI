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
        const userId = decoded.userId;

        const connections = await connectionRepo.getConnectionsByUser(userId);

        // Return only active connections and strip sensitive data
        const activeConnections = connections
            .filter(c => c.isActive)
            .map(c => ({
                platform: c.platform,
                connectedAt: c.connectedAt,
            }));

        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({ connections: activeConnections }),
        };
    } catch (error) {
        console.error('List Connections Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
