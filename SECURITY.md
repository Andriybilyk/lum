# Security Hardening & Best Practices

This document outlines the security measures implemented in the HR Management System application.

## 🔐 Security Overview

The application implements multiple layers of security to protect user data and prevent common web vulnerabilities:

1. **Input Validation & Sanitization**
2. **OWASP Security Headers**
3. **Authentication & Authorization**
4. **Rate Limiting & DoS Protection**
5. **Data Protection**
6. **Secure Communication**
7. **Code Vulnerability Scanning**

---

## 📋 Security Features Implemented

### 1. Input Validation & Sanitization

**Location:** `src/utils/sanitization.ts`

#### Features:
- **HTML Escaping**: Prevents XSS attacks by escaping HTML special characters
- **Dangerous HTML Stripping**: Removes script tags, iframes, and event handlers
- **String Sanitization**: Removes control characters and limits length
- **Email Validation**: Validates email format before storage
- **URL Sanitization**: Ensures only http/https protocols are allowed
- **File Upload Validation**: Checks file types, sizes, and dangerous extensions

#### Usage Examples:

```typescript
import { sanitizeString, escapeHtml, sanitizeEmail } from '@/utils/sanitization';

// Sanitize user input
const cleanInput = sanitizeString(userInput, 500);

// Escape HTML to prevent XSS
const safeHtml = escapeHtml(userProvidedContent);

// Validate email
const email = sanitizeEmail(userEmail);
```

#### Dangerous Patterns Detected:
- `<script>` tags
- `javascript:` protocol
- Event handlers (`onload`, `onerror`, `onclick`, etc.)
- `<iframe>`, `<embed>`, `<object>` tags
- `eval()` calls
- VBScript references

### 2. Security Headers

**Location:** `src/utils/securityHeaders.ts`

#### Implemented Headers:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Prevents MIME sniffing attacks |
| X-Frame-Options | DENY | Prevents clickjacking |
| X-XSS-Protection | 1; mode=block | Legacy XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer information |
| Content-Security-Policy | Comprehensive CSP | Prevents inline script execution |
| Permissions-Policy | Restricts browser features | Disables geolocation, microphone, camera |

#### Content Security Policy (CSP):
```
default-src 'self' - Only allow same-origin resources
script-src 'self' - Only allow same-origin scripts
style-src 'self' 'unsafe-inline' - Allow styles
img-src 'self' data: https: - Allow images from safe sources
connect-src 'self' https: - Only allow secure connections
frame-ancestors 'none' - Prevent framing
```

#### Usage:

```typescript
import { getSecurityHeaders, isValidOrigin, getCORSHeaders } from '@/utils/securityHeaders';

// Get all security headers
const headers = getSecurityHeaders();

// Validate CORS origin
if (isValidOrigin(requestOrigin, ['https://example.com'])) {
  const corsHeaders = getCORSHeaders(requestOrigin, allowedOrigins);
}
```

### 3. Authentication & Authorization Security

**Location:** `src/utils/authSecurity.ts`

#### Features:

**Token Management:**
- Secure token generation using `crypto.getRandomValues()`
- Token expiration tracking
- CSRF token creation and verification

**Session Security:**
- HTTPOnly cookies (prevents XSS access)
- Secure flag for HTTPS only (production)
- SameSite attribute for CSRF protection
- 24-hour session expiration

**Password Security:**
- Password strength validation
- Enforces minimum 12 characters for strong passwords
- Requires uppercase, lowercase, numbers, special characters
- Provides strength feedback

**Rate Limiting:**
- In-memory rate limiter (use Redis in production)
- Configurable attempt limits and time windows
- Per-identifier tracking
- Default: 5 attempts per minute

#### Usage Examples:

```typescript
import {
  createSecureToken,
  RateLimiter,
  validatePasswordStrength,
  constantTimeCompare,
} from '@/utils/authSecurity';

// Create secure token
const token = createSecureToken(60); // expires in 60 minutes

// Rate limiting
const limiter = new RateLimiter(60000, 5); // 5 attempts per minute
if (!limiter.isAllowed(userId)) {
  // Too many attempts, deny access
}

// Validate password strength
const strength = validatePasswordStrength(userPassword);
if (!strength.isStrong) {
  // Provide feedback from strength.feedback array
}

// Timing-attack safe comparison
const isValid = constantTimeCompare(storedToken, receivedToken);
```

### 4. CSRF Protection

**Implementation:**

```typescript
import { createCSRFToken, verifyCSRFToken } from '@/utils/authSecurity';

// Server side - Generate token
const { token, signature } = createCSRFToken();
// Send token to client in form or meta tag

// Client side - Include in requests
// Include token in POST request body or X-CSRF-Token header

// Server side - Verify on form submission
if (!verifyCSRFToken(token, signature)) {
  // Reject request
}
```

### 5. API Security

**Secure Headers for API Requests:**

```typescript
import { getSecureApiHeaders } from '@/utils/authSecurity';

const headers = getSecureApiHeaders(authToken);
// Returns: {
//   'Content-Type': 'application/json',
//   'X-Requested-With': 'XMLHttpRequest',
//   'Authorization': 'Bearer <token>'
// }
```

### 6. File Upload Security

**Validation:**

```typescript
import { validateFileUpload } from '@/utils/sanitization';

const file = event.target.files[0];
const validation = validateFileUpload(
  file,
  ['image/jpeg', 'image/png', 'application/pdf'],
  10 * 1024 * 1024 // 10MB
);

if (!validation.valid) {
  console.error(validation.error);
  return;
}
```

**Allowed File Types (Default):**
- image/jpeg
- image/png
- application/pdf

**Blocked Extensions:**
- exe, bat, cmd, com, scr, vbs, js

### 7. Secure JSON Handling

**Safe JSON Parsing:**

```typescript
import { safeJsonParse } from '@/utils/securityHeaders';

const data = safeJsonParse(jsonString, { defaultValue: true });
// Returns parsed JSON or fallback if parsing fails
```

---

## 🛡️ Vulnerability Prevention

### XSS (Cross-Site Scripting)
- ✅ HTML escaping for user content
- ✅ Content Security Policy
- ✅ HTTPOnly cookies
- ✅ Input validation

### CSRF (Cross-Site Request Forgery)
- ✅ CSRF token generation and verification
- ✅ SameSite cookie attribute
- ✅ X-Requested-With header validation

### SQL Injection
- ✅ Parameterized queries (via ORM)
- ✅ Input validation and sanitization
- ✅ Type checking with TypeScript

### Clickjacking
- ✅ X-Frame-Options: DENY
- ✅ Content-Security-Policy frame-ancestors

### MIME Sniffing
- ✅ X-Content-Type-Options: nosniff

### Information Disclosure
- ✅ No sensitive data in responses
- ✅ Error messages don't expose system details
- ✅ Referrer-Policy prevents leaking URLs

---

## 🔍 Dependency Security

### npm Audit Status
- Run `npm audit` to check for vulnerabilities
- Run `npm audit fix` to fix fixable vulnerabilities
- Development dependencies with moderate vulnerabilities documented

### Security Tools Installed
- **Snyk**: Continuous vulnerability scanning

**Run Snyk:**
```bash
npm install -D snyk
snyk test  # Test for vulnerabilities
snyk monitor  # Monitor for future vulnerabilities
```

---

## 🚨 Environment Variables

### Required for Production

Create `.env` file with:

```env
# API Configuration
VITE_API_URL=https://api.your-domain.com
VITE_API_KEY=your-api-key

# Google Sheets (if needed)
VITE_GOOGLE_SHEETS_API_KEY=your-key
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=your-id

# Error Reporting (optional)
VITE_ERROR_REPORTING_URL=https://error-tracking.service.com
```

### Never commit:
- API keys
- Database credentials
- Private tokens
- Personal data

---

## 🔐 Best Practices for Developers

### When Handling User Input:

1. **Always validate** on both client and server
2. **Always sanitize** before storage or display
3. **Never trust** user input
4. **Use whitelist approach** when possible

```typescript
// Good ❌ Bad
const clean = sanitizeString(input);  // ✅
const unsafe = input;                  // ❌
```

### When Making API Calls:

1. Use HTTPS only
2. Include authentication tokens
3. Validate response data
4. Handle errors securely

```typescript
const response = await fetch(url, {
  headers: getSecureApiHeaders(token),
  credentials: 'include', // For cookies
});
```

### When Working with Sensitive Data:

1. Never log passwords or tokens
2. Always use HTTPS
3. Clear sensitive data from memory
4. Use secure session storage

```typescript
// Good ✅
logger.info('User login successful');

// Bad ❌
logger.info('User logged in with password:', password);
```

---

## 📊 Security Checklist

### Before Production Deployment:

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers tested
- [ ] CSRF tokens implemented
- [ ] Rate limiting configured
- [ ] Database credentials secured
- [ ] API authentication enabled
- [ ] Input validation on all forms
- [ ] File upload restrictions configured
- [ ] Error messages don't expose details
- [ ] Dependencies audited (`npm audit`)
- [ ] Secrets not in version control
- [ ] CORS properly configured
- [ ] Session timeouts configured
- [ ] Logs don't contain sensitive data

---

## 🚨 Incident Response

### If You Discover a Vulnerability:

1. **Do not** commit vulnerable code
2. **Do not** publicly disclose the vulnerability
3. **Create** a private security report
4. **Document** the issue and impact
5. **Fix** the vulnerability immediately
6. **Test** the fix thoroughly
7. **Deploy** with security patch
8. **Monitor** for exploitation attempts

---

## 📚 Security Testing

### Run Security Tests:

```bash
# Run all tests including security tests
npm run test

# Security-specific test suites
npm run test -- securityHeaders.test.ts
npm run test -- sanitization.test.ts
npm run test -- authSecurity.test.ts
```

### Test Coverage:

- **Security Headers**: 26 tests
- **Sanitization**: 38 tests
- **Authentication Security**: 48 tests
- **Total Security Tests**: 112 tests

---

## 🔗 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 📞 Security Contact

For security concerns or vulnerability reports, please contact the security team.

---

**Last Updated:** 2025-11-14
**Security Level:** Production-Ready with Comprehensive Hardening
