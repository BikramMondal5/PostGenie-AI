// Data model types based on design document

export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface PlatformConnection {
  connectionId: string;
  userId: string;
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  connectedAt: string;
  isActive: boolean;
}

export interface VoiceProfile {
  profileId: string;
  userId: string;
  platform: string;
  tone: 'professional' | 'casual' | 'friendly' | 'technical';
  frequentWords: string[];
  vocabularyComplexity: number;
  avgSentenceLength: number;
  commonPhrases: string[];
  emotionalTone: string[];
  hashtagUsage: number;
  emojiUsage: number;
  systemInstruction?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FineTunedModel {
  modelId: string;
  userId: string;
  platform: string;
  baseModel: string;
  fineTunedModelArn: string;
  trainingDataSize: number;
  status: 'training' | 'ready' | 'failed';
  createdAt: string;
  lastUpdatedAt: string;
}

export interface Post {
  postId: string;
  userId: string;
  platform: string;
  content: string;
  isGenerated: boolean;
  templateUsed?: string;
  postedAt?: string;
  externalPostId?: string;
  metadata: {
    hashtags: string[];
    mentions: string[];
    mediaUrls: string[];
  };
}

export interface PostTemplate {
  templateId: string;
  userId: string;
  oneLineDetail: string;
  description?: string;
  createdAt: string;
}

export interface GeneratedContent {
  contentId: string;
  userId: string;
  templateId: string;
  platformContents: {
    [platform: string]: {
      content: string;
      edited: boolean;
      postedAt?: string;
    };
  };
  createdAt: string;
}
