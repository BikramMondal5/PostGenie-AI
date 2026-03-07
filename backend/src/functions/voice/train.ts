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
        const { platform, content, systemInstruction } = body;

        if (!platform || (!content && !systemInstruction)) {
            return {
                statusCode: 400,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Platform and either content or systemInstruction are required' }),
            };
        }

        let profileToSave: any;

        if (systemInstruction) {
            console.log(`Setting direct system instruction for user ${userId} on ${platform}`);
            // Get existing profiles to inherit styles if any
            const existingProfiles = await profileRepo.getProfilesByUserPlatform(userId, platform);
            const primary = existingProfiles.length > 0 ? existingProfiles[0] : null;

            profileToSave = {
                userId,
                platform,
                systemInstruction,
                isActive: true,
                tone: primary?.tone || 'casual',
                frequentWords: primary?.frequentWords || [],
                vocabularyComplexity: primary?.vocabularyComplexity || 0.5,
                avgSentenceLength: primary?.avgSentenceLength || 15,
                commonPhrases: primary?.commonPhrases || [],
                emotionalTone: primary?.emotionalTone || ['neutral'],
                hashtagUsage: primary?.hashtagUsage || 0.2,
                emojiUsage: primary?.emojiUsage || 0.2
            };
        } else {
            console.log(`Analyzing voice for user ${userId} on ${platform}`);
            const analyzed = await analysisService.analyzeVoice(userId, platform, content);
            profileToSave = {
                ...analyzed,
                isActive: true
            };
        }

        const savedProfile = await profileRepo.createProfile(profileToSave);

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
