export interface GenerateImageOptions {
    prompt: string;
    apiUrl?: string;
    apiKey?: string;
    model?: string;
}

export interface GenerateImageResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

/**
 * Generate an image using Pollinations AI
 * Returns the direct URL to the generated image
 */
export async function generateImage({
    prompt,
    apiUrl = 'https://image.pollinations.ai/prompt',
    model = 'flux'
}: GenerateImageOptions): Promise<GenerateImageResult> {
    if (!prompt) {
        return {
            success: false,
            error: 'Prompt is required'
        };
    }

    try {
        const axios = require('axios');
        const encodedPrompt = encodeURIComponent(prompt);
        // Build the Pollinations /gen endpoint which returns an image binary
        // Prefer env var, fall back to known key from the working Image Generator reference
        const key = (process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY || process.env.IMAGE_API_KEY || '')
            || 'sk_EiSJCRT3UqfNGX6oAG2ml8R6b7eWBlPZ';
        // Prefer gen.pollinations.ai image endpoint
        const imageEndpoint = (apiUrl.includes('gen.pollinations.ai') || apiUrl.includes('/image'))
            ? apiUrl
            : 'https://gen.pollinations.ai/image';

        // Construct URL with encoded prompt
        const url = `${imageEndpoint}/${encodedPrompt}?model=${model}`;

        const headers: any = {};
        if (key) headers.Authorization = `Bearer ${key}`;

        const resp = await axios.get(url, { responseType: 'arraybuffer', headers, timeout: 60000 });
        const buffer = Buffer.from(resp.data);
        const base64 = buffer.toString('base64');
        const mime = resp.headers && resp.headers['content-type'] ? resp.headers['content-type'] : 'image/png';
        const dataUri = `data:${mime};base64,${base64}`;

        return {
            success: true,
            imageUrl: dataUri
        };
    } catch (error) {
        console.error('Image generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate image'
        };
    }
}
