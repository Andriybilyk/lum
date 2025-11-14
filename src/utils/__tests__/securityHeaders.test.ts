import { describe, it, expect } from 'vitest';
import {
  getSecurityHeaders,
  isValidOrigin,
  getCORSHeaders,
  sanitizeUrl,
  safeJsonParse,
  generateSecureToken,
  containsSuspiciousPatterns,
} from '../securityHeaders';

describe('Security Headers', () => {
  it('should return security headers', () => {
    const headers = getSecurityHeaders();

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should include Content Security Policy', () => {
    const headers = getSecurityHeaders();
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['Content-Security-Policy']).toContain('frame-ancestors');
  });

  it('should include Permissions Policy', () => {
    const headers = getSecurityHeaders();
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
    expect(headers['Permissions-Policy']).toContain('microphone=()');
  });
});

describe('CORS Headers', () => {
  it('should validate correct origin', () => {
    const isValid = isValidOrigin('https://example.com', ['https://example.com']);
    expect(isValid).toBe(true);
  });

  it('should reject invalid origin', () => {
    const isValid = isValidOrigin('https://evil.com', ['https://example.com']);
    expect(isValid).toBe(false);
  });

  it('should handle malformed origin', () => {
    const isValid = isValidOrigin('not-a-valid-url', ['https://example.com']);
    expect(isValid).toBe(false);
  });

  it('should return CORS headers for valid origin', () => {
    const headers = getCORSHeaders('https://example.com', ['https://example.com']);

    expect(headers['Access-Control-Allow-Origin']).toBe('https://example.com');
    expect(headers['Access-Control-Allow-Methods']).toContain('GET');
  });

  it('should return empty headers for invalid origin', () => {
    const headers = getCORSHeaders('https://evil.com', ['https://example.com']);
    expect(Object.keys(headers).length).toBe(0);
  });
});

describe('URL Sanitization', () => {
  it('should allow valid HTTPS URLs', () => {
    const url = sanitizeUrl('https://example.com/path');
    expect(url).toBe('https://example.com/path');
  });

  it('should allow valid HTTP URLs', () => {
    const url = sanitizeUrl('http://example.com/path');
    expect(url).toBe('http://example.com/path');
  });

  it('should reject javascript: protocol', () => {
    const url = sanitizeUrl('javascript:alert("XSS")');
    expect(url).toBeNull();
  });

  it('should reject data: protocol', () => {
    const url = sanitizeUrl('data:text/html,<script>alert("XSS")</script>');
    expect(url).toBeNull();
  });

  it('should reject malformed URLs', () => {
    const url = sanitizeUrl('not-a-valid-url');
    expect(url).toBeNull();
  });
});

describe('JSON Safety', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse('{"name":"John"}', { name: 'default' });
    expect(result.name).toBe('John');
  });

  it('should return fallback for invalid JSON', () => {
    const fallback = { name: 'default' };
    const result = safeJsonParse('invalid json', fallback);
    expect(result).toEqual(fallback);
  });

  it('should handle empty JSON', () => {
    const fallback = { name: 'default' };
    const result = safeJsonParse('', fallback);
    expect(result).toEqual(fallback);
  });
});

describe('Secure Token Generation', () => {
  it('should generate token of correct length', () => {
    const token = generateSecureToken(32);
    expect(token).toHaveLength(32);
  });

  it('should generate random tokens', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);
    expect(token1).not.toBe(token2);
  });

  it('should generate tokens with alphanumeric characters only', () => {
    const token = generateSecureToken(100);
    expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true);
  });

  it('should support custom length', () => {
    const token16 = generateSecureToken(16);
    const token64 = generateSecureToken(64);

    expect(token16).toHaveLength(16);
    expect(token64).toHaveLength(64);
  });
});

describe('Suspicious Pattern Detection', () => {
  it('should detect script tags', () => {
    const result = containsSuspiciousPatterns('<script>alert("XSS")</script>');
    expect(result).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    const result = containsSuspiciousPatterns('javascript:void(0)');
    expect(result).toBe(true);
  });

  it('should detect event handlers', () => {
    const result = containsSuspiciousPatterns('onload=alert("XSS")');
    expect(result).toBe(true);
  });

  it('should detect iframe tags', () => {
    const result = containsSuspiciousPatterns('<iframe src="..."></iframe>');
    expect(result).toBe(true);
  });

  it('should allow safe content', () => {
    const result = containsSuspiciousPatterns('This is safe content 123');
    expect(result).toBe(false);
  });

  it('should be case-insensitive', () => {
    const result = containsSuspiciousPatterns('<SCRIPT>alert("XSS")</SCRIPT>');
    expect(result).toBe(true);
  });
});
