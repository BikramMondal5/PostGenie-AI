import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VoiceAnalysisService } from '../../services/VoiceAnalysisService';
import { VoiceProfileRepository } from '../../repositories/VoiceProfileRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';

const analysisService = new VoiceAnalysisService();
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
                body: JSON.stringify({ message: 'Unauthorized: No token provided' }),
            };
        }

        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (e) {
            return {
                statusCode: 401,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Unauthorized: Invalid token' }),
            };
        }

        const { userId } = decoded;

        const body = JSON.parse(event.body || '{}');
        const { platform, content } = body;

        if (!platform || !content) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Platform and content are required' }),
            };
        }

        console.log(`Analyzing voice for user ${userId} on ${platform}`);
        const analyzedProfile = await analysisService.analyzeVoice(userId, platform, content);

        const savedProfile = await profileRepo.upsertProfile(analyzedProfile);

        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                message: 'Voice profile updated successfully',
                profile: savedProfile,
            }),
        };
    } catch (error) {
        console.error('Training Error:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
