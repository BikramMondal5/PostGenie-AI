# Content Generation Lambda Functions

This directory contains Lambda functions for content generation:

- `generate.ts` - Generate platform-specific content
- `generateImage.ts` - Generate AI images from text prompts
- `getContent.ts` - Retrieve generated content

## Image Generation

### Endpoint
`POST /content/generate-image`

### Request Body
```json
{
  "prompt": "A futuristic city at sunset",
  "model": "flux" // optional
}
```

### Response
```json
{
  "success": true,
  "message": "Image generated successfully",
  "imageUrl": "https://image.pollinations.ai/..."
}
```

### Features
- Authenticated endpoint (requires JWT token)
- Uses Pollinations AI for image generation
- Configurable models (default: flux)
- Returns direct image URLs
- Proper error handling

### Testing
```bash
curl -X POST https://your-api.com/content/generate-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}'
```

