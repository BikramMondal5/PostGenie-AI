import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

const SECRET_NAME = 'PostGenie/OAuth';

/**
 * Fetches OAuth credentials from Secrets Manager
 */
export async function getOAuthSecrets() {
    try {
        const response = await client.send(
            new GetSecretValueCommand({
                SecretId: SECRET_NAME,
            })
        );

        if (response.SecretString) {
            return JSON.parse(response.SecretString);
        }

        throw new Error('Secret not found');
    } catch (error) {
        console.error('Error fetching secrets:', error);
        // Return empty placeholders if secret doesn't exist yet to prevent total crash
        return {
            linkedin: { clientId: '', clientSecret: '' },
            twitter: { clientId: '', clientSecret: '' },
            instagram: { clientId: '', clientSecret: '' },
            facebook: { clientId: '', clientSecret: '' },
        };
    }
}
