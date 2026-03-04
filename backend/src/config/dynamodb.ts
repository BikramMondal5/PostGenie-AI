import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Create DynamoDB Document client for easier operations
export const dynamoDb = DynamoDBDocumentClient.from(client);

// Table names from environment variables
export const TABLES = {
  USERS: process.env.USERS_TABLE || 'PostGenie-Users',
  CONNECTIONS: process.env.CONNECTIONS_TABLE || 'PostGenie-Connections',
  VOICE_PROFILES: process.env.VOICE_PROFILES_TABLE || 'PostGenie-VoiceProfiles',
  MODELS: process.env.MODELS_TABLE || 'PostGenie-Models',
  POSTS: process.env.POSTS_TABLE || 'PostGenie-Posts',
};
