# Image Generator Component - Usage Guide

## Overview
This is a reusable image generation component that uses AI to create images from text prompts.

## File Structure
```
my-app/
├── components/
│   └── ImageGenerator.tsx          # Main UI component
├── lib/
│   └── imageGenerator.ts           # Backend logic
└── app/
    └── api/
        └── generate-image/
            └── route.ts            # API endpoint
```

## How to Use in Future Projects

### 1. Copy Required Files
Copy these files to your new project:
- `components/ImageGenerator.tsx` - The UI component
- `lib/imageGenerator.ts` - The backend logic
- `app/api/generate-image/route.ts` - The API route

### 2. Basic Usage
```tsx
import ImageGenerator from '@/components/ImageGenerator';

export default function MyPage() {
  return (
    <div>
      <ImageGenerator />
    </div>
  );
}
```

### 3. Advanced Usage with Callbacks
```tsx
import ImageGenerator from '@/components/ImageGenerator';

export default function MyPage() {
  const handleSuccess = (imageUrl: string) => {
    console.log('Image generated:', imageUrl);
    // Do something with the image URL
  };

  const handleError = (error: string) => {
    console.error('Generation failed:', error);
    // Handle error
  };

  return (
    <ImageGenerator 
      apiEndpoint="/api/generate-image"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### 4. Using the Backend Logic Directly
```typescript
import { generateImage } from '@/lib/imageGenerator';

// In an API route or server component
const result = await generateImage({
  prompt: 'A beautiful sunset',
  outputFileName: 'custom-name.png',
  outputPath: '/custom/path'
});
```

### 5. Customizing the API
You can customize the image generation by modifying `lib/imageGenerator.ts`:
- Change the `apiUrl` to use a different image generation service
- Update the `apiKey` with your own credentials
- Modify the output path or filename

### 6. Environment Variables (Recommended)
For production, store sensitive data in environment variables:

Create `.env.local`:
```
IMAGE_API_URL=https://gen.pollinations.ai/image
IMAGE_API_KEY=your_api_key_here
```

Update `lib/imageGenerator.ts`:
```typescript
apiUrl = process.env.IMAGE_API_URL || 'https://gen.pollinations.ai/image',
apiKey = process.env.IMAGE_API_KEY || '',
```

## Component Props

### ImageGenerator
- `apiEndpoint` (optional): Custom API endpoint (default: '/api/generate-image')
- `onSuccess` (optional): Callback when image is generated successfully
- `onError` (optional): Callback when generation fails

## Dependencies
- Next.js 13+ (App Router)
- React
- Tailwind CSS (for styling)

## Notes
- Generated images are saved to the `public` folder by default
- Images are accessible at `/photo.png` (or custom filename)
- The component uses a timestamp query parameter to force image refresh
