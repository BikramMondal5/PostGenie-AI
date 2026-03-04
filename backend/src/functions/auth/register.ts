import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserRepository } from '../../repositories/UserRepository';
import { successResponse, errorResponse } from '../../utils/response';
import { isValidEmail, isValidPassword, sanitizeEmail, validateRequiredFields } from '../../utils/validation';
import { generateToken } from '../../utils/jwt';

const userRepository = new UserRepository();

/**
 * Lambda handler for user registration
 * POST /auth/register
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

    // Validate email format
    if (!isValidEmail(sanitizedEmail)) {
      return errorResponse(400, 'Invalid email format');
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return errorResponse(
        400,
        'Password must be at least 8 characters and contain both letters and numbers'
      );
    }

    // Check if email already exists
    const emailExists = await userRepository.emailExists(sanitizedEmail);
    if (emailExists) {
      return errorResponse(409, 'Email already registered');
    }

    // Create user
    const user = await userRepository.createUser(sanitizedEmail, password);

    // Generate JWT token
    const token = generateToken(user.userId, user.email);

    // Return success response (exclude password hash)
    return successResponse({
      user: {
        userId: user.userId,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse(500, 'Internal server error', error);
  }
};
