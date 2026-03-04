/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: At least 8 characters, contains letter and number
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) {
    return false;
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasLetter && hasNumber;
};

/**
 * Sanitize email (lowercase and trim)
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (
  body: any,
  requiredFields: string[]
): { valid: boolean; missing: string[] } => {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
};
