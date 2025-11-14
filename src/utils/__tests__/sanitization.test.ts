import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripDangerousHtml,
  sanitizeString,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeNumber,
  sanitizeStringArray,
  sanitizeObject,
  validateFileUpload,
} from '../sanitization';

describe('HTML Escaping', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const result = escapeHtml(input);

    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('should escape ampersands', () => {
    const input = 'Tom & Jerry';
    const result = escapeHtml(input);

    expect(result).toBe('Tom &amp; Jerry');
  });

  it('should escape single quotes', () => {
    const input = "It's a test";
    const result = escapeHtml(input);

    expect(result).toBe('It&#039;s a test');
  });
});

describe('Dangerous HTML Stripping', () => {
  it('should remove script tags', () => {
    const html = '<p>Hello</p><script>alert("XSS")</script>';
    const result = stripDangerousHtml(html);

    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>');
  });

  it('should remove iframe tags', () => {
    const html = '<p>Content</p><iframe src="evil.com"></iframe>';
    const result = stripDangerousHtml(html);

    expect(result).not.toContain('<iframe');
  });

  it('should remove event handlers', () => {
    const html = '<img src="image.jpg" onerror="alert(\'XSS\')">';
    const result = stripDangerousHtml(html);

    expect(result).not.toContain('onerror');
  });

  it('should preserve safe HTML', () => {
    const html = '<h1>Title</h1><p>Paragraph</p>';
    const result = stripDangerousHtml(html);

    expect(result).toContain('<h1>');
    expect(result).toContain('<p>');
  });
});

describe('String Sanitization', () => {
  it('should trim whitespace', () => {
    const result = sanitizeString('  hello world  ');
    expect(result).toBe('hello world');
  });

  it('should enforce max length', () => {
    const result = sanitizeString('This is a long string', 10);
    expect(result).toHaveLength(10);
    expect(result).toBe('This is a ');
  });

  it('should remove dangerous characters', () => {
    const result = sanitizeString('Hello<script>alert</script>World');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should remove control characters', () => {
    const input = 'Hello\x00\x1FWorld';
    const result = sanitizeString(input);

    expect(result).toBe('HelloWorld');
  });

  it('should handle empty string', () => {
    const result = sanitizeString('');
    expect(result).toBe('');
  });
});

describe('Email Sanitization', () => {
  it('should accept valid emails', () => {
    const result = sanitizeEmail('user@example.com');
    expect(result).toBe('user@example.com');
  });

  it('should reject invalid emails', () => {
    const result = sanitizeEmail('invalid-email');
    expect(result).toBe('');
  });

  it('should convert to lowercase', () => {
    const result = sanitizeEmail('User@EXAMPLE.COM');
    expect(result).toBe('user@example.com');
  });

  it('should enforce max length', () => {
    const result = sanitizeEmail('a'.repeat(300) + '@example.com');
    expect(result.length).toBeLessThanOrEqual(254);
  });
});

describe('URL Sanitization', () => {
  it('should accept HTTPS URLs', () => {
    const result = sanitizeUrl('https://example.com/path');
    expect(result).toBe('https://example.com/path');
  });

  it('should accept HTTP URLs', () => {
    const result = sanitizeUrl('http://example.com/path');
    expect(result).toBe('http://example.com/path');
  });

  it('should reject javascript: protocol', () => {
    const result = sanitizeUrl('javascript:void(0)');
    expect(result).toBe('');
  });

  it('should reject data: protocol', () => {
    const result = sanitizeUrl('data:text/html,<script>alert("XSS")</script>');
    expect(result).toBe('');
  });

  it('should reject malformed URLs', () => {
    const result = sanitizeUrl('not a valid url');
    expect(result).toBe('');
  });
});

describe('Number Sanitization', () => {
  it('should accept valid numbers', () => {
    const result = sanitizeNumber(42);
    expect(result).toBe(42);
  });

  it('should accept numeric strings', () => {
    const result = sanitizeNumber('42');
    expect(result).toBe(42);
  });

  it('should enforce min value', () => {
    const result = sanitizeNumber(-10, 0);
    expect(result).toBeNull();
  });

  it('should enforce max value', () => {
    const result = sanitizeNumber(100, 0, 50);
    expect(result).toBeNull();
  });

  it('should return null for non-numeric values', () => {
    const result = sanitizeNumber('not a number');
    expect(result).toBeNull();
  });
});

describe('String Array Sanitization', () => {
  it('should sanitize array of strings', () => {
    const input = ['hello', 'world', '  test  '];
    const result = sanitizeStringArray(input);

    expect(result).toEqual(['hello', 'world', 'test']);
  });

  it('should remove non-string elements', () => {
    const input = ['hello', 123, 'world', null];
    const result = sanitizeStringArray(input as any);

    expect(result).toEqual(['hello', 'world']);
  });

  it('should enforce max length per string', () => {
    const input = ['a'.repeat(200)];
    const result = sanitizeStringArray(input, 50);

    expect(result[0]).toHaveLength(50);
  });

  it('should return empty array for non-array input', () => {
    const result = sanitizeStringArray('not an array' as any);
    expect(result).toEqual([]);
  });
});

describe('Object Sanitization', () => {
  it('should sanitize object properties', () => {
    const input = {
      name: '  John  ',
      age: 30,
      email: 'john@example.com',
    };

    const result = sanitizeObject(input);

    expect(result.name).toBe('John');
    expect(result.age).toBe(30);
  });

  it('should handle nested objects', () => {
    const input = {
      name: 'John',
      details: {
        bio: '  software engineer  ',
      },
    };

    const result = sanitizeObject(input);

    expect(result.details?.bio).toBe('software engineer');
  });

  it('should handle arrays in objects', () => {
    const input = {
      name: 'John',
      tags: ['  tag1  ', 'tag2'],
    };

    const result = sanitizeObject(input);

    expect((result.tags as any)?.[0]).toBe('tag1');
  });
});

describe('File Upload Validation', () => {
  it('should accept allowed file types', () => {
    const file = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
    const result = validateFileUpload(file);

    expect(result.valid).toBe(true);
  });

  it('should reject disallowed file types', () => {
    const file = new File(['content'], 'malware.exe', { type: 'application/x-msdownload' });
    const result = validateFileUpload(file);

    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should enforce file size limit', () => {
    const largeContent = new Array(11 * 1024 * 1024).fill('x').join('');
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
    const result = validateFileUpload(file);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should reject dangerous extensions', () => {
    const file = new File(['content'], 'script.exe', { type: 'text/plain' });
    const result = validateFileUpload(file);

    expect(result.valid).toBe(false);
  });

  it('should validate filename', () => {
    const file = new File(['content'], '', { type: 'image/jpeg' });
    const result = validateFileUpload(file);

    expect(result.valid).toBe(false);
  });
});
