import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../../repositories/UserRepository';
import { verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import * as bcrypt from 'bcryptjs';

const userRepo = new UserRepository();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const getCorsHeaders = () => {
        const reqOrigin = event.headers.origin || event.headers.Origin || '*';
        return {
            'Access-Control-Allow-Origin': reqOrigin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS',
        };
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: getCorsHeaders(), body: '' };
    }

    try {
        const authHeader = event.headers.Authorization || event.headers.authorization;
        const token = extractTokenFromHeader(authHeader);
        if (!token) {
            return { statusCode: 401, headers: getCorsHeaders(), body: JSON.stringify({ message: 'Unauthorized' }) };
        }

        let decoded: any;
        try {
            decoded = verifyToken(token);
        } catch {
            return { statusCode: 401, headers: getCorsHeaders(), body: JSON.stringify({ message: 'Invalid token' }) };
        }

        const { userId } = decoded;

        // GET — fetch profile
        if (event.httpMethod === 'GET') {
            const user = await userRepo.getUserById(userId);
            if (!user) {
                return { statusCode: 404, headers: getCorsHeaders(), body: JSON.stringify({ message: 'User not found' }) };
            }

            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({
                    user: {
                        userId: user.userId,
                        email: user.email,
                        displayName: user.displayName || '',
                        avatarUrl: user.avatarUrl || '',
                        bio: user.bio || '',
                        timezone: user.timezone || 'UTC',
                        createdAt: user.createdAt,
                        lastLoginAt: user.lastLoginAt,
                    }
                })
            };
        }

        // PATCH — update profile or change password
        if (event.httpMethod === 'PATCH') {
            const body = JSON.parse(event.body || '{}');
            const { displayName, avatarUrl, bio, timezone, currentPassword, newPassword } = body;

            // Change password flow
            if (newPassword) {
                if (!currentPassword) {
                    return { statusCode: 400, headers: getCorsHeaders(), body: JSON.stringify({ message: 'Current password is required' }) };
                }
                const user = await userRepo.getUserById(userId);
                if (!user) {
                    return { statusCode: 404, headers: getCorsHeaders(), body: JSON.stringify({ message: 'User not found' }) };
                }
                const valid = await bcrypt.compare(currentPassword, user.passwordHash);
                if (!valid) {
                    return { statusCode: 400, headers: getCorsHeaders(), body: JSON.stringify({ message: 'Current password is incorrect' }) };
                }
                await userRepo.updatePassword(userId, newPassword);
                return { statusCode: 200, headers: getCorsHeaders(), body: JSON.stringify({ message: 'Password updated successfully' }) };
            }

            // General profile update
            const updates: any = {};
            if (displayName !== undefined) updates.displayName = displayName;
            if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
            if (bio !== undefined) updates.bio = bio;
            if (timezone !== undefined) updates.timezone = timezone;

            await userRepo.updateProfile(userId, updates);

            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Profile updated successfully' })
            };
        }

        // DELETE — delete account
        if (event.httpMethod === 'DELETE') {
            await userRepo.deleteUser(userId);
            return {
                statusCode: 200,
                headers: getCorsHeaders(),
                body: JSON.stringify({ message: 'Account deleted successfully' })
            };
        }

        return { statusCode: 405, headers: getCorsHeaders(), body: JSON.stringify({ message: 'Method not allowed' }) };

    } catch (error: any) {
        console.error('Profile Error:', error);
        return { statusCode: 500, headers: getCorsHeaders(), body: JSON.stringify({ message: error.message || 'Internal server error' }) };
    }
};
