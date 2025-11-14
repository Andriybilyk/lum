/**
 * Authentication & Authorization Security Utilities
 * Handles secure token management, password hashing, and session security
 */

/**
 * Token validation and expiration
 */
export interface SecureToken {
  token: string;
  expiresAt: number;
  createdAt: number;
}

/**
 * Create a secure token with expiration
 */
export const createSecureToken = (expirationMinutes: number = 60): SecureToken => {
  const now = Date.now();
  const expiresAt = now + expirationMinutes * 60 * 1000;

  return {
    token: generateRandomToken(32),
    expiresAt,
    createdAt: now,
  };
};

/**
 * Validate token expiration
 */
export const isTokenExpired = (token: SecureToken): boolean => {
  return Date.now() > token.expiresAt;
};

/**
 * Generate secure random token
 */
export const generateRandomToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    token += chars[array[i] % chars.length];
  }

  return token;
};

/**
 * Create CSRF token
 */
export const createCSRFToken = (): { token: string; signature: string } => {
  const token = generateRandomToken(32);
  const signature = hashToken(token);

  return { token, signature };
};

/**
 * Verify CSRF token
 */
export const verifyCSRFToken = (token: string, signature: string): boolean => {
  const expectedSignature = hashToken(token);
  return constantTimeCompare(signature, expectedSignature);
};

/**
 * Hash a token for storage (simple hash for CSRF, not for passwords)
 */
export const hashToken = (token: string): string => {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

/**
 * Constant time string comparison to prevent timing attacks
 */
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Session security configuration
 */
export interface SessionConfig {
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}

/**
 * Get secure session configuration
 */
export const getSecureSessionConfig = (isProduction: boolean): SessionConfig => {
  return {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: isProduction, // Only HTTPS in production
    httpOnly: true, // Prevent XSS access
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection
  };
};

/**
 * Rate limiting store (in-memory, use Redis in production)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxAttempts: number;

  constructor(windowMs: number = 60 * 1000, maxAttempts: number = 5) {
    this.windowMs = windowMs;
    this.maxAttempts = maxAttempts;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    const recentAttempts = attempts.filter((timestamp) => now - timestamp < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);

    return true;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  getAttempts(identifier: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];
    return attempts.filter((timestamp) => now - timestamp < this.windowMs).length;
  }
}

/**
 * Password security validation
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (!password || password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score++;
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters');
  }

  return {
    score: Math.min(score, 4),
    feedback,
    isStrong: score >= 4 && password.length >= 12,
  };
};

/**
 * Sanitize user input for security
 */
export const sanitizeUserInput = (input: string, maxLength: number = 255): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"']/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Permission validation helper
 */
export const hasPermission = (
  userRoles: string[],
  requiredRoles: string[],
  requireAll: boolean = false
): boolean => {
  if (requireAll) {
    return requiredRoles.every((role) => userRoles.includes(role));
  }
  return requiredRoles.some((role) => userRoles.includes(role));
};

/**
 * Create secure headers for API requests
 */
export const getSecureApiHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};
