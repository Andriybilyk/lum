import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSecureToken,
  isTokenExpired,
  generateRandomToken,
  createCSRFToken,
  verifyCSRFToken,
  constantTimeCompare,
  getSecureSessionConfig,
  RateLimiter,
  validatePasswordStrength,
  sanitizeUserInput,
  hasPermission,
} from '../authSecurity';

describe('Secure Tokens', () => {
  it('should create token with expiration', () => {
    const token = createSecureToken(60);

    expect(token.token).toBeDefined();
    expect(token.expiresAt).toBeGreaterThan(Date.now());
    expect(token.createdAt).toBeDefined();
  });

  it('should detect expired tokens', () => {
    const token = createSecureToken(-1);
    expect(isTokenExpired(token)).toBe(true);
  });

  it('should detect non-expired tokens', () => {
    const token = createSecureToken(60);
    expect(isTokenExpired(token)).toBe(false);
  });

  it('should generate random tokens', () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);

    expect(token1).not.toBe(token2);
  });

  it('should generate token of correct length', () => {
    const token = generateRandomToken(64);
    expect(token).toHaveLength(64);
  });
});

describe('CSRF Protection', () => {
  it('should create CSRF token pair', () => {
    const { token, signature } = createCSRFToken();

    expect(token).toBeDefined();
    expect(signature).toBeDefined();
  });

  it('should verify valid CSRF token', () => {
    const { token, signature } = createCSRFToken();
    const isValid = verifyCSRFToken(token, signature);

    expect(isValid).toBe(true);
  });

  it('should reject invalid CSRF token', () => {
    const { signature } = createCSRFToken();
    const invalidToken = 'invalid-token-xyz';

    const isValid = verifyCSRFToken(invalidToken, signature);

    expect(isValid).toBe(false);
  });

  it('should reject tampered signature', () => {
    const { token } = createCSRFToken();
    const tamperedSignature = 'tampered-signature-abc';

    const isValid = verifyCSRFToken(token, tamperedSignature);

    expect(isValid).toBe(false);
  });
});

describe('Constant Time Comparison', () => {
  it('should compare equal strings as equal', () => {
    const result = constantTimeCompare('secret', 'secret');
    expect(result).toBe(true);
  });

  it('should compare different strings as different', () => {
    const result = constantTimeCompare('secret', 'hacked');
    expect(result).toBe(false);
  });

  it('should handle different lengths', () => {
    const result = constantTimeCompare('short', 'much-longer-string');
    expect(result).toBe(false);
  });

  it('should prevent timing attacks', () => {
    const times = [];

    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      constantTimeCompare('a'.repeat(100), 'a'.repeat(99) + 'b');
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b) / times.length;
    expect(avgTime).toBeGreaterThan(0);
  });
});

describe('Session Configuration', () => {
  it('should return secure session config for production', () => {
    const config = getSecureSessionConfig(true);

    expect(config.secure).toBe(true);
    expect(config.httpOnly).toBe(true);
    expect(config.sameSite).toBe('strict');
  });

  it('should return relaxed session config for development', () => {
    const config = getSecureSessionConfig(false);

    expect(config.secure).toBe(false);
    expect(config.httpOnly).toBe(true);
    expect(config.sameSite).toBe('lax');
  });

  it('should have reasonable maxAge', () => {
    const config = getSecureSessionConfig(true);
    expect(config.maxAge).toBe(24 * 60 * 60 * 1000);
  });
});

describe('Rate Limiting', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter(1000, 3);
  });

  it('should allow requests within limit', () => {
    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-1')).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-1');

    expect(limiter.isAllowed('user-1')).toBe(false);
  });

  it('should track per-identifier', () => {
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-2');

    expect(limiter.isAllowed('user-1')).toBe(true);
    expect(limiter.isAllowed('user-2')).toBe(true);
  });

  it('should reset attempts', () => {
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-1');
    limiter.reset('user-1');

    expect(limiter.isAllowed('user-1')).toBe(true);
  });

  it('should return current attempt count', () => {
    limiter.isAllowed('user-1');
    limiter.isAllowed('user-1');

    expect(limiter.getAttempts('user-1')).toBe(2);
  });
});

describe('Password Strength Validation', () => {
  it('should reject short passwords', () => {
    const result = validatePasswordStrength('short');
    expect(result.isStrong).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = validatePasswordStrength('nouppercase123!');
    expect(result.feedback).toContain('Add uppercase letters');
  });

  it('should reject password without lowercase', () => {
    const result = validatePasswordStrength('NOLOWERCASE123!');
    expect(result.feedback).toContain('Add lowercase letters');
  });

  it('should reject password without numbers', () => {
    const result = validatePasswordStrength('NoNumbers!');
    expect(result.feedback).toContain('Add numbers');
  });

  it('should reject password without special characters', () => {
    const result = validatePasswordStrength('NoSpecial123');
    expect(result.feedback).toContain('Add special characters');
  });

  it('should accept strong password', () => {
    const result = validatePasswordStrength('StrongPass123!');
    expect(result.isStrong).toBe(true);
    expect(result.feedback).toHaveLength(0);
  });

  it('should score password strength', () => {
    const weak = validatePasswordStrength('weak');
    const medium = validatePasswordStrength('AbcDef1');
    const strong = validatePasswordStrength('StrongPass123!@#');

    expect(weak.score).toBeLessThan(medium.score);
    expect(medium.score).toBeLessThanOrEqual(strong.score);
  });
});

describe('User Input Sanitization', () => {
  it('should remove HTML tags', () => {
    const result = sanitizeUserInput('<script>alert("XSS")</script>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should remove quotes', () => {
    const result = sanitizeUserInput('He said "hello"');
    expect(result).not.toContain('"');
  });

  it('should remove javascript: protocol', () => {
    const result = sanitizeUserInput('javascript:void(0)');
    expect(result).not.toContain('javascript:');
  });

  it('should remove event handlers', () => {
    const result = sanitizeUserInput('onerror=alert("XSS")');
    expect(result).not.toContain('onerror');
  });

  it('should enforce max length', () => {
    const result = sanitizeUserInput('a'.repeat(300), 100);
    expect(result.length).toBeLessThanOrEqual(100);
  });
});

describe('Permission Validation', () => {
  it('should grant access for single required role', () => {
    const result = hasPermission(['admin'], ['admin']);
    expect(result).toBe(true);
  });

  it('should deny access for missing role', () => {
    const result = hasPermission(['user'], ['admin']);
    expect(result).toBe(false);
  });

  it('should check multiple roles with OR logic by default', () => {
    const result = hasPermission(['user', 'moderator'], ['admin', 'user']);
    expect(result).toBe(true);
  });

  it('should check multiple roles with AND logic when specified', () => {
    const result = hasPermission(['user', 'moderator'], ['user', 'admin'], true);
    expect(result).toBe(false);
  });

  it('should handle empty role list', () => {
    const result = hasPermission([], ['admin']);
    expect(result).toBe(false);
  });
});
