import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const bucketName = process.env.MEDIA_BUCKET;

export async function uploadImage(buffer: Buffer, contentType: string): Promise<string> {
    if (!bucketName) {
        throw new Error('MEDIA_BUCKET environment variable not set');
    }

    const key = `images/${uuidv4()}.${contentType.split('/')[1] || 'png'}`;

    await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));

    return key;
}

export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!bucketName) {
        throw new Error('MEDIA_BUCKET environment variable not set');
    }

    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getAssetUrl(key: string): Promise<string> {
    // For now, return a presigned URL. 
    // In a production app with CloudFront, you'd return the CloudFront URL.
    return getPresignedUrl(key);
}

export async function uploadBase64Image(base64: string): Promise<string> {
    // Extract format and data
    const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);

    if (!matches || matches.length !== 3) {
        // Fallback for raw base64 without data prefix
        const buffer = Buffer.from(base64, 'base64');
        return uploadImage(buffer, 'image/png');
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return uploadImage(buffer, contentType);
}
