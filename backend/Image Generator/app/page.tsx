'use client';

import ImageGenerator from '@/components/ImageGenerator';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <ImageGenerator />
    </div>
  );
}
