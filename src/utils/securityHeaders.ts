/**
 * Security Headers Configuration
 * Implements OWASP recommended security headers
 */

export interface SecurityHeaders {
  [key: string]: string;
}

/**
 * Get security headers for HTTP responses
 * These headers help prevent common web vulnerabilities
 */
export const getSecurityHeaders = (): SecurityHeaders => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  };
};

/**
 * Apply security headers to a fetch request
 */
export const addSecurityHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const securityHeaders = getSecurityHeaders();
  return {
    ...headers,
    ...Object.fromEntries(
      Object.entries(securityHeaders).map(([key, value]) => [key.toLowerCase(), value])
    ),
  };
};

/**
 * Validate origin for CORS requests
 */
export const isValidOrigin = (origin: string, allowedOrigins: string[]): boolean => {
  try {
    const originUrl = new URL(origin);
    return allowedOrigins.some((allowed) => {
      const allowedUrl = new URL(allowed);
      return originUrl.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
};

/**
 * Get CORS headers for cross-origin requests
 */
export const getCORSHeaders = (origin: string, allowedOrigins: string[]): SecurityHeaders => {
  if (!isValidOrigin(origin, allowedOrigins)) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
};

/**
 * Prevent common injection attacks
 */
export const sanitizeUrl = (url: string): string | null => {
  try {
    const parsedUrl = new URL(url);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

/**
 * Validate and sanitize JSON
 */
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

/**
 * Generate security-safe random token
 */
export const generateSecureToken = (length: number = 32): string => {
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
 * Check if a value looks like it might contain malicious code
 */
export const containsSuspiciousPatterns = (value: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(value));
};
