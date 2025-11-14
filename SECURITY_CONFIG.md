# Security Configuration Guide

This guide provides step-by-step instructions for configuring security in the HR Management System.

## 🔧 Initial Setup

### 1. Environment Configuration

Create `.env.local` in the project root:

```bash
# Development environment
VITE_API_URL=http://localhost:3000/api
VITE_API_KEY=dev-key-12345

# Google Sheets integration (optional)
VITE_GOOGLE_SHEETS_API_KEY=your-google-api-key
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Error tracking (optional)
VITE_ERROR_REPORTING_URL=https://sentry.io/...
```

### 2. Add to .gitignore

Ensure sensitive files are never committed:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Sensitive data
*.pem
*.key
secrets.json
credentials.json

# Logs
*.log
logs/

# Dependencies
node_modules/
```

---

## 🛡️ Security Headers Configuration

### For Vite Development Server

Add to `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "default-src 'self'",
    },
  },
});
```

### For Production Server (Express.js example)

```typescript
import helmet from 'helmet';
import { getSecurityHeaders } from './utils/securityHeaders';

app.use(helmet());

// Custom headers
app.use((req, res, next) => {
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});
```

### For Supabase/Backend

Add security middleware to your backend functions:

```typescript
// supabase/functions/secure-api/index.ts
import { getSecurityHeaders } from '../utils/securityHeaders';

Deno.serve(async (req) => {
  const headers = getSecurityHeaders();

  return new Response('data', {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
});
```

---

## 🔐 CORS Configuration

### For Development

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    cors: {
      origin: ['http://localhost:5173'],
      credentials: true,
    },
  },
});
```

### For Production

```typescript
// backend/middleware/cors.ts
import { isValidOrigin, getCORSHeaders } from '../utils/securityHeaders';

const allowedOrigins = [
  'https://app.example.com',
  'https://admin.example.com',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isValidOrigin(origin, allowedOrigins)) {
    const corsHeaders = getCORSHeaders(origin, allowedOrigins);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  next();
});
```

---

## 🔑 Authentication Security

### Implementing Secure Login

```typescript
import {
  RateLimiter,
  validatePasswordStrength,
  getSecureApiHeaders,
} from '@/utils/authSecurity';

// Rate limiting for login attempts
const loginLimiter = new RateLimiter(
  60 * 1000,  // 1 minute window
  5            // 5 attempts max
);

async function handleLogin(email: string, password: string) {
  // Check rate limit
  if (!loginLimiter.isAllowed(email)) {
    throw new Error('Too many login attempts. Please try again later.');
  }

  // Validate password strength
  const strength = validatePasswordStrength(password);
  if (!strength.isStrong) {
    throw new Error('Password does not meet security requirements');
  }

  // Make API call with secure headers
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      ...getSecureApiHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Include cookies
  });

  return response.json();
}
```

---

## 🛡️ Input Validation

### Form Validation Example

```typescript
import {
  sanitizeString,
  sanitizeEmail,
  validateFileUpload,
} from '@/utils/sanitization';

async function handleFormSubmit(formData: FormData) {
  // Validate and sanitize user input
  const name = sanitizeString(formData.get('name') as string, 100);
  const email = sanitizeEmail(formData.get('email') as string);

  // Validate file upload
  const file = formData.get('document') as File;
  if (file) {
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.valid) {
      throw new Error(fileValidation.error);
    }
  }

  // Proceed with sanitized data
  await submitForm({ name, email, file });
}
```

---

## 🔄 API Request Security

### Implementing Secure API Calls

```typescript
import { getSecureApiHeaders } from '@/utils/authSecurity';
import { sanitizeUrl } from '@/utils/securityHeaders';

async function secureApiCall(endpoint: string, options: RequestInit = {}) {
  // Validate URL
  const url = sanitizeUrl(`${API_BASE_URL}${endpoint}`);
  if (!url) {
    throw new Error('Invalid URL');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getSecureApiHeaders(authToken),
      ...options.headers,
    },
  });

  // Handle errors securely (no sensitive data)
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

---

## 📝 Logging Security

### Secure Logging Implementation

```typescript
import { logger } from '@/utils/logger';
import { sanitizeUserInput } from '@/utils/authSecurity';

// ✅ Good - No sensitive data
logger.info('User login successful', { userId: user.id });

// ✅ Good - Sanitized data
logger.debug('Form submitted', { field: sanitizeUserInput(input) });

// ❌ Bad - Logs password
logger.info('Login attempt', { email, password });

// ❌ Bad - Logs token
logger.info('API response', { token: authToken });
```

---

## 🚀 Database Security

### Prepared Statements (TypeScript/Supabase)

```typescript
// ✅ Safe - Parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail);

// ❌ Unsafe - String concatenation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

### Data Encryption

```typescript
// For sensitive fields, use encryption
import { encrypt, decrypt } from '@/utils/encryption';

// Store encrypted
const encryptedSSN = encrypt(userSSN);
await database.users.update({ ssn: encryptedSSN });

// Decrypt when needed
const decrypted = decrypt(encryptedSSN);
```

---

## 🔍 Security Testing

### Running Security Tests

```bash
# Run all tests
npm run test

# Run specific security tests
npm run test -- securityHeaders.test.ts
npm run test -- sanitization.test.ts
npm run test -- authSecurity.test.ts

# Run with coverage
npm run test:coverage
```

### Manual Security Testing Checklist

- [ ] Test XSS protection with `<script>alert('XSS')</script>`
- [ ] Test CSRF protection with forged requests
- [ ] Test rate limiting with multiple requests
- [ ] Test file upload with malicious files
- [ ] Test SQL injection with special characters
- [ ] Test broken authentication with invalid tokens
- [ ] Test sensitive data exposure in logs

---

## 🚨 Monitoring & Alerts

### Error Tracking Setup (Sentry example)

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_ERROR_REPORTING_URL,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Capture exceptions
try {
  // code
} catch (error) {
  Sentry.captureException(error);
}
```

---

## 📋 Security Audit Checklist

### Weekly
- [ ] Check `npm audit` results
- [ ] Review application logs for suspicious activity
- [ ] Test authentication system

### Monthly
- [ ] Update dependencies
- [ ] Run full security test suite
- [ ] Review access logs
- [ ] Check for new vulnerabilities in Snyk

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing (if possible)
- [ ] Review security policies
- [ ] Update security documentation

---

## 🆘 Emergency Response

### If Compromise is Suspected

1. **Isolate** the affected system
2. **Notify** security team immediately
3. **Revoke** all active sessions/tokens
4. **Reset** passwords for affected accounts
5. **Audit** logs for malicious activity
6. **Apply** security patches
7. **Monitor** for further activity
8. **Communicate** with affected users

### If Data Breach Occurs

1. **Document** what happened
2. **Assess** the impact
3. **Notify** affected users
4. **Report** to authorities (if required)
5. **Implement** preventative measures
6. **Update** security documentation

---

## 🔐 Production Deployment Checklist

- [ ] All environment variables set
- [ ] HTTPS enabled with valid certificate
- [ ] Security headers configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] Logging enabled and monitored
- [ ] Database credentials secured
- [ ] API authentication enabled
- [ ] Input validation on all forms
- [ ] Error pages don't expose details
- [ ] Dependencies audited
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Security monitoring enabled
- [ ] Incident response plan ready

---

## 📚 Additional Resources

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated:** 2025-11-14
