import { NextResponse } from 'next/server';
import { generateImage } from '@/lib/imageGenerator';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    const result = await generateImage({ prompt });

    console.log(`Image saved as ${result.fileName}`);

    return NextResponse.json({ 
      success: true, 
      message: "Image generated successfully",
      fileName: result.fileName
    });
  } catch (error) {
    console.error("Error generating image:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
