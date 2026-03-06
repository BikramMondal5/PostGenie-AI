import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';
import { successResponse, errorResponse, createResponse } from '../../utils/response';
import { generateImage } from '../../utils/imageGenerator';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // 1. Authenticate user
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return errorResponse(401, 'Unauthorized: No token provided');
    }

    try {
        verifyToken(token);
    } catch (e: any) {
        return errorResponse(401, `Unauthorized: ${e.message}`);
    }

    // 2. Parse request body
    if (!event.body) {
        return errorResponse(400, 'Request body is required');
    }

    let prompt: string;
    let model: string | undefined;

    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt;
        model = body.model;
    } catch (e) {
        return errorResponse(400, 'Invalid JSON body');
    }

    if (!prompt || typeof prompt !== 'string') {
        return errorResponse(400, 'A valid prompt string is required');
    }

    try {
        // Generate image
        const result = await generateImage({ prompt, model });

        if (!result.success) {
            return errorResponse(500, result.error || 'Failed to generate image');
        }

        // Return a flat JSON body so frontend `api.post` receives { success, imageUrl }
        return createResponse(200, {
            success: true,
            message: 'Image generated successfully',
            imageUrl: result.imageUrl
        });
    } catch (error: any) {
        console.error('Error in generateImage handler:', error);
        return errorResponse(500, error.message || 'Failed to generate image');
    }
};
