import { APIGatewayProxyEvent } from 'aws-lambda';
import { verifyToken, extractTokenFromHeader, JwtPayload } from '../utils/jwt';

/**
 * Authenticate request and extract user information from JWT token
 */
export const authenticate = (event: APIGatewayProxyEvent): JwtPayload => {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    return verifyToken(token);
  } catch (error) {
    throw new Error('Invalid or expired authentication token');
  }
};

/**
 * Extract user ID from authenticated request
 */
export const getUserIdFromEvent = (event: APIGatewayProxyEvent): string => {
  const payload = authenticate(event);
  return payload.userId;
};
