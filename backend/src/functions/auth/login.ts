import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../../repositories/UserRepository';
import { successResponse, errorResponse } from '../../utils/response';
import { sanitizeEmail, validateRequiredFields } from '../../utils/validation';
import { generateToken } from '../../utils/jwt';

const userRepository = new UserRepository();

/**
 * Lambda handler for user login
 * POST /auth/login
 * Body: { email: string, password: string }
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    if (!event.body) {
      return errorResponse(400, 'Request body is required');
    }

    const body = JSON.parse(event.body);

    // Validate required fields
    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.valid) {
      return errorResponse(400, `Missing required fields: ${validation.missing.join(', ')}`);
    }

    const { email, password } = body;

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Get user by email
    const user = await userRepository.getUserByEmail(sanitizedEmail);
    if (!user) {
      return errorResponse(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await userRepository.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return errorResponse(401, 'Invalid email or password');
    }

    // Update last login timestamp
    await userRepository.updateLastLogin(user.userId);

    // Generate JWT token
    const token = generateToken(user.userId, user.email);

    // Return success response (exclude password hash)
    return successResponse({
      user: {
        userId: user.userId,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: new Date().toISOString(),
      },
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse(500, 'Internal server error', error);
  }
};
