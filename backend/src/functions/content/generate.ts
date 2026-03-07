import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import axios from 'axios';
import { extractTokenFromHeader, verifyToken } from '../../utils/jwt';
import { successResponse, errorResponse } from '../../utils/response';

import { VoiceProfileRepository } from '../../repositories/VoiceProfileRepository';

const bedrock = new BedrockRuntimeClient({});
const profileRepo = new VoiceProfileRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // 1. Authenticate user
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
        return errorResponse(401, 'Unauthorized: No token provided');
    }

    let decoded;
    try {
        decoded = verifyToken(token);
    } catch (e: any) {
        return errorResponse(401, `Unauthorized: ${e.message}`);
    }

    const userId = decoded.userId;

    // 2. Parse request body
    if (!event.body) {
        return errorResponse(400, 'Request body is required');
    }

    let prompt = '';
    let platforms: string[] | undefined;
    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt;
        platforms = body.platforms; // Optional: specific platforms to regenerate
    } catch (e) {
        return errorResponse(400, 'Invalid JSON body');
    }

    if (!prompt || typeof prompt !== 'string') {
        return errorResponse(400, 'A valid prompt string is required');
    }

    try {
        // Fetch user voice profiles
        const userProfiles = await profileRepo.getProfilesByUser(userId);
        const voiceConfigs = userProfiles.reduce((acc: any, p) => {
            acc[p.platform] = p.systemInstruction;
            return acc;
        }, {});
        // 3. Generate content for platforms via Bedrock
        const generateForPlatform = async (platformName: string, guidelines: string, modelId: string, isRegeneration: boolean = false) => {
            const systemPrompt = `You are an expert social media manager. You create highly engaging, viral, and authentic posts for ${platformName}. ${guidelines}`;
            const regenerationNote = isRegeneration ? '\n\nIMPORTANT: Create a completely NEW and DIFFERENT version of this post while maintaining the same tone and style. Do not repeat the same content.' : '';
            const userPrompt = `Write a post based on the following input:\n\n${prompt}${regenerationNote}\n\nDo not include any commentary or explanations. Just output the final post directly.`;

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
                    temperature: isRegeneration ? 0.9 : 0.7,
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
                const generatedContent = responseBody.output.message.content[0].text.trim();
                console.log(`[Bedrock ${platformName}] Success:`, generatedContent.substring(0, 100));
                return generatedContent;
            } catch (err: any) {
                console.warn(`[Bedrock ${platformName}] Failed:`, err.message);
                console.log(`[Bedrock ${platformName}] Attempting Groq fallback...`);
                try {
                    return await generateWithGroq(platformName, guidelines, prompt, isRegeneration);
                } catch (groqErr: any) {
                    console.error(`[Groq ${platformName}] Also failed:`, groqErr.message);
                    throw new Error(`Both Bedrock and Groq failed for ${platformName}`);
                }
            }
        };

        // Run sequentially to avoid ThrottlingException (HTTP 429) on Bedrock
        // If platforms array is provided, only generate for those platforms
        const shouldGenerateLinkedIn = !platforms || platforms.includes('linkedin');
        const shouldGenerateTwitter = !platforms || platforms.includes('twitter');
        const shouldGenerateInstagram = !platforms || platforms.includes('instagram');
        const isRegeneration = platforms && platforms.length > 0;

        const linkedinPost = shouldGenerateLinkedIn
            ? await generateForPlatform('LinkedIn', `Keep it professional but conversational. Use engaging hooks, storytelling if applicable, and format with line breaks for readability. Use 3-5 relevant hashtags. ${voiceConfigs.linkedin || ''}`, 'us.amazon.nova-lite-v1:0', isRegeneration)
            : null;
        const twitterPost = shouldGenerateTwitter
            ? await generateForPlatform('Twitter/X', `Keep it concise, punchy, and under 280 characters. Use short sentences, perhaps a thought-provoking question, and 1-2 hashtags. ${voiceConfigs.twitter || ''}`, 'us.amazon.nova-micro-v1:0', isRegeneration)
            : null;
        const instagramPost = shouldGenerateInstagram
            ? await generateForPlatform('Instagram', `Keep it visually descriptive and lifestyle-focused. Use a catchy opening and write an engaging caption. End with a call to action and plenty of relevant hashtags. ${voiceConfigs.instagram || ''}`, 'us.amazon.nova-pro-v1:0', isRegeneration)
            : null;

        const newPosts = [];
        if (twitterPost) newPosts.push({ platform: "twitter", content: twitterPost });
        if (linkedinPost) newPosts.push({ platform: "linkedin", content: linkedinPost });
        if (instagramPost) newPosts.push({ platform: "instagram", content: instagramPost });

        return successResponse({ posts: newPosts });
    } catch (error: any) {
        console.error('Bedrock Generation Error:', error);
        return errorResponse(500, 'Failed to generate content', error);
    }
};

async function generateWithGroq(platformName: string, guidelines: string, userPrompt: string, isRegeneration: boolean = false) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('[Groq] GROQ_API_KEY not configured in environment');
        throw new Error('GROQ_API_KEY not configured');
    }

    const systemPrompt = `You are an expert social media manager. You create highly engaging, viral, and authentic posts for ${platformName}. ${guidelines}`;
    const regenerationNote = isRegeneration ? '\n\nIMPORTANT: Create a completely NEW and DIFFERENT version of this post while maintaining the same tone and style. Do not repeat the same content.' : '';

    console.log(`[Groq] Generating for ${platformName}...`);

    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Write a post based on the following input:\n\n${userPrompt}${regenerationNote}\n\nDo not include any commentary or explanations. Just output the final post directly.` }
            ],
            temperature: isRegeneration ? 0.9 : 0.7,
            max_tokens: 1024,
        },
        {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        }
    );

    const generatedContent = response.data.choices[0].message.content.trim();
    console.log(`[Groq ${platformName}] Success:`, generatedContent.substring(0, 100));
    return generatedContent;
}
