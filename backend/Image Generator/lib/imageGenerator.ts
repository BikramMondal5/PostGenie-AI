import fs from 'fs';
import path from 'path';

export interface GenerateImageOptions {
  prompt: string;
  apiUrl?: string;
  apiKey?: string;
  outputPath?: string;
  outputFileName?: string;
}

export async function generateImage({
  prompt,
  apiUrl = 'https://gen.pollinations.ai/image',
  apiKey = 'sk_EiSJCRT3UqfNGX6oAG2ml8R6b7eWBlPZ',
  outputPath,
  outputFileName = 'photo.png'
}: GenerateImageOptions) {
  if (!prompt) {
    throw new Error('Prompt is required');
  }

  const encodedPrompt = encodeURIComponent(prompt);
  const url = `${apiUrl}/${encodedPrompt}?model=klein-large`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  
  const filePath = outputPath 
    ? path.join(outputPath, outputFileName)
    : path.join(process.cwd(), 'public', outputFileName);
  
  fs.writeFileSync(filePath, buffer);

  return {
    success: true,
    filePath,
    fileName: outputFileName
  };
}
