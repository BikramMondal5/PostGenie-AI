import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';
import { successResponse, errorResponse } from '../../utils/response';

const bedrock = new BedrockRuntimeClient({});

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

    let prompt = '';
    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt;
    } catch (e) {
        return errorResponse(400, 'Invalid JSON body');
    }

    if (!prompt || typeof prompt !== 'string') {
        return errorResponse(400, 'A valid prompt string is required');
    }

    try {
        // 3. Generate content for platforms via Bedrock
        const generateForPlatform = async (platformName: string, guidelines: string, modelId: string) => {
            const systemPrompt = `You are an expert social media manager. You create highly engaging, viral, and authentic posts for ${platformName}. ${guidelines}`;
            const userPrompt = `Write a post based on the following input:\n\n${prompt}\n\nDo not include any commentary or explanations. Just output the final post directly.`;

            const payload = {
                system: [{ text: systemPrompt }],
                messages: [
                    {
                        role: "user",
                        content: [{ text: userPrompt }]
                    }
                ],
                inferenceConfig: {
                    maxTokens: 1000,
                    temperature: 0.7,
                }
            };

            const command = new InvokeModelCommand({
                modelId: modelId,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify(payload),
            });

            try {
                const response = await bedrock.send(command);
                const responseBody = JSON.parse(new TextDecoder().decode(response.body));
                return responseBody.output.message.content[0].text.trim();
            } catch (err: any) {
                console.warn(`[Bedrock ${platformName}] Failed, using fallback:`, err.message);
                return `🚀 ${prompt}\n\nHere's an amazing AI-generated post optimized for ${platformName}! #ContentCreator #PostGenieAI #AI`;
            }
        };

        // Run sequentially to avoid ThrottlingException (HTTP 429) on Bedrock
        const linkedinPost = await generateForPlatform('LinkedIn', 'Keep it professional but conversational. Use engaging hooks, storytelling if applicable, and format with line breaks for readability. Use 3-5 relevant hashtags.', 'eu.amazon.nova-lite-v1:0');
        const twitterPost = await generateForPlatform('Twitter/X', 'Keep it concise, punchy, and under 280 characters. Use short sentences, perhaps a thought-provoking question, and 1-2 hashtags.', 'eu.amazon.nova-micro-v1:0');
        const instagramPost = await generateForPlatform('Instagram', 'Keep it visually descriptive and lifestyle-focused. Use a catchy opening and write an engaging caption. End with a call to action and plenty of relevant hashtags.', 'eu.amazon.nova-pro-v1:0');

        const newPosts = [
            { platform: "twitter", content: twitterPost },
            { platform: "linkedin", content: linkedinPost },
            { platform: "instagram", content: instagramPost }
        ];

        return successResponse({ posts: newPosts });
    } catch (error: any) {
        console.error('Bedrock Generation Error:', error);
        return errorResponse(500, 'Failed to generate content', error);
    }
};
