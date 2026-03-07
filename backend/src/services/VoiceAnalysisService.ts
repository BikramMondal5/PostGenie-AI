import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { VoiceProfile } from "../types";

const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
});

export class VoiceAnalysisService {
    /**
     * Analyzes text content to extract writing style and tone using Amazon Bedrock
     */
    async analyzeVoice(userId: string, platform: string, content: string): Promise<Omit<VoiceProfile, "profileId" | "createdAt" | "updatedAt" | "isActive">> {
        const prompt = `
      Analyze the following social media posts and extract a detailed writing style profile.
      Return ONLY a JSON object with the following structure:
      {
        "tone": "professional" | "casual" | "friendly" | "technical",
        "frequentWords": ["word1", "word2"...],
        "vocabularyComplexity": number (0-1),
        "avgSentenceLength": number,
        "commonPhrases": ["phrase1", "phrase2"...],
        "emotionalTone": ["list of emotions"],
        "hashtagUsage": number (0-1),
        "emojiUsage": number (0-1)
      }

      CONTENT TO ANALYZE:
      ${content}
    `;

        // Using Claude 4.5 Sonnet
        const input = {
            modelId: "anthropic.claude-sonnet-4-5-20250929-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
        };

        try {
            const command = new InvokeModelCommand(input);
            const response = await client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

            // Extract the JSON string from Claude's response
            const resultText = responseBody.content[0].text;
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                throw new Error("Could not find JSON in AI response");
            }

            const analyzedData = JSON.parse(jsonMatch[0]);

            return {
                userId,
                platform,
                ...analyzedData
            };
        } catch (error) {
            console.error("Bedrock Analysis Error:", error);
            // Fallback to a default profile if AI fails
            return {
                userId,
                platform,
                tone: "casual",
                frequentWords: [],
                vocabularyComplexity: 0.5,
                avgSentenceLength: 15,
                commonPhrases: [],
                emotionalTone: ["neutral"],
                hashtagUsage: 0.2,
                emojiUsage: 0.2
            };
        }
    }
}
