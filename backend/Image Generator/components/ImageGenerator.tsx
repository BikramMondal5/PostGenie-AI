'use client';

import { useState } from 'react';

interface ImageGeneratorProps {
  apiEndpoint?: string;
  onSuccess?: (imageUrl: string) => void;
  onError?: (error: string) => void;
}

export default function ImageGenerator({ 
  apiEndpoint = '/api/generate-image',
  onSuccess,
  onError 
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      
      if (data.success) {
        const newImageUrl = `/photo.png?t=${Date.now()}`;
        setImageUrl(newImageUrl);
        onSuccess?.(newImageUrl);
        alert('Image generated successfully!');
      } else {
        const errorMsg = data.error || 'Failed to generate image';
        onError?.(errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = 'Error generating image';
      onError?.(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your image prompt here..."
        className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
      />
      <button 
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>
      
      {imageUrl && (
        <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden dark:border-gray-600">
          <img 
            src={imageUrl} 
            alt="Generated image" 
            className="w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
