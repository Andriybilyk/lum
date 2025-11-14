/**
 * Input Sanitization Utilities
 * Prevents XSS, injection attacks, and data corruption
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
};

/**
 * Remove potentially dangerous HTML tags and attributes
 */
export const stripDangerousHtml = (html: string): string => {
  const dangerousElements = ['script', 'iframe', 'embed', 'object', 'form'];
  const dangerousAttributes = [
    'onload',
    'onerror',
    'onmouseover',
    'onmouseout',
    'onclick',
    'onchange',
    'onsubmit',
    'onfocus',
    'onblur',
    'href',
  ];

  let result = html;

  dangerousElements.forEach((element) => {
    const regex = new RegExp(`<${element}[^>]*>([\\s\\S]*?)</${element}>`, 'gi');
    result = result.replace(regex, '');
  });

  dangerousAttributes.forEach((attr) => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]*)`, 'gi');
    result = result.replace(regex, '');
  });

  return result;
};

/**
 * Sanitize string input for database storage
 */
export const sanitizeString = (input: string, maxLength: number = 500): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[<>]/g, '');
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = sanitizeString(email, 254).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize URL to prevent javascript: protocol and other attacks
 */
export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitize numeric input
 */
export const sanitizeNumber = (value: unknown, min: number = -Infinity, max: number = Infinity): number | null => {
  const num = Number(value);
  if (Number.isNaN(num) || num < min || num > max) {
    return null;
  }
  return num;
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (arr: unknown[], maxLength: number = 100): string[] => {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizeString(item, maxLength))
    .filter((item) => item.length > 0);
};

/**
 * Sanitize object by sanitizing all string properties
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  maxStringLength: number = 500
): Partial<T> => {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key as keyof T] = sanitizeString(value, maxStringLength) as any;
    } else if (typeof value === 'number') {
      result[key as keyof T] = value as any;
    } else if (typeof value === 'boolean') {
      result[key as keyof T] = value as any;
    } else if (Array.isArray(value)) {
      result[key as keyof T] = sanitizeStringArray(value, maxStringLength) as any;
    } else if (value && typeof value === 'object') {
      result[key as keyof T] = sanitizeObject(value, maxStringLength) as any;
    }
  }

  return result;
};

/**
 * Create content security policy nonce for inline scripts
 */
export const generateCSPNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Validate file upload safety
 */
export const validateFileUpload = (
  file: File,
  allowedMimeTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
  maxSize: number = 10 * 1024 * 1024 // 10MB
): { valid: boolean; error?: string } => {
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (!file.name || file.name.length > 255) {
    return {
      valid: false,
      error: 'Invalid filename',
    };
  }

  const dangerousExtensions = ['exe', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension && dangerousExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type not allowed: ${fileExtension}`,
    };
  }

  return { valid: true };
};
