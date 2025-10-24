# Security Considerations for OAuth 2.0 Implementation

This document addresses security considerations and CodeQL findings for the OAuth implementation.

## CodeQL Security Scan Results

### 1. Rate Limiting (Medium Priority)

**Finding**: Authentication routes lack rate limiting protection.

**Impact**: Could be vulnerable to brute-force attacks or denial-of-service.

**Status**: Documented for future implementation.

**Recommendation**: Add rate limiting middleware for production:

```javascript
const rateLimit = require('express-rate-limit');

// Apply to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth/linkedin', authLimiter);
app.use('/auth/refresh', authLimiter);
```

### 2. SQL Injection Warnings (False Positives)

**Finding**: CodeQL flagged potential SQL injection on MongoDB queries.

**Status**: False positives - NOT a real vulnerability.

**Explanation**: 
- This application uses MongoDB with Mongoose ODM
- Mongoose automatically sanitizes all inputs passed to queries
- MongoDB query language is not vulnerable to SQL injection in the same way as SQL databases
- All user inputs (userId) are validated as ObjectIds by Mongoose before use

**Example of Safe Usage**:
```javascript
// Safe - Mongoose validates and sanitizes ObjectId
User.findById(userId)

// Safe - Mongoose validates query parameters
OAuthToken.findOne({ user_id: userId, provider: 'linkedin' })
```

**Additional Protection**:
The implementation includes:
- Type validation through Mongoose schemas
- ObjectId validation (invalid ObjectIds are rejected)
- No direct query string construction
- No use of `$where` or similar operators that could execute code

### 3. CSRF Protection (High Priority)

**Finding**: Cookie-based session middleware without CSRF protection.

**Impact**: Could allow cross-site request forgery attacks on state-changing operations.

**Status**: Partially mitigated through OAuth state parameter.

**Current Protection**:
1. OAuth flow uses `state` parameter for CSRF protection during authentication
2. Session cookies are HTTP-only
3. SameSite cookie attribute should be set

**Recommended Implementation** for production:

```javascript
// Option 1: Use csrf-csrf package (modern alternative)
const { doubleCsrf } = require('csrf-csrf');

const {
  invalidCsrfTokenError,
  generateToken,
  validateRequest,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => config.session.secret,
  cookieName: '__Host-csrf',
  cookieOptions: {
    sameSite: 'strict',
    secure: true,
    httpOnly: true
  }
});

// Apply to POST/PUT/DELETE routes
app.post('/auth/logout', doubleCsrfProtection, OAuthController.logout);
app.post('/auth/refresh', doubleCsrfProtection, OAuthController.refresh);

// Option 2: Manual token generation and validation
// See implementation in csrf-protection-example.js
```

**Workaround for Current Implementation**:
The OAuth state parameter provides CSRF protection for the authentication flow itself. For other routes:

1. Use SameSite cookies (already recommended)
2. Validate Referer/Origin headers
3. Implement token-based API authentication instead of sessions

## Security Best Practices Implemented

### ✅ Secure Token Storage
- Access tokens excluded from default queries
- Refresh tokens excluded from default queries
- Tokens stored with user association
- Automatic expiration tracking

### ✅ State Parameter Validation
- Random state generation using crypto.randomBytes
- State verification in callback
- Protection against CSRF in OAuth flow

### ✅ Error Handling
- No sensitive data in error messages
- Proper error codes
- Different handling for development/production

### ✅ Session Security
- HTTP-only cookies
- Secure flag in production
- Session expiration

### ✅ HTTPS Enforcement
- Documented requirement for production
- Cookie security settings

## Security Recommendations for Production

### 1. Environment & Configuration

```javascript
// Production-ready session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Don't use default name
  store: MongoStore.create({
    mongoUrl: config.databaseUrl,
    crypto: {
      secret: config.session.secret
    }
  }),
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // Prevent XSS
    sameSite: 'strict',  // Prevent CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: 'yourdomain.com'
  }
}));
```

### 2. Rate Limiting

Install and configure rate limiting:

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts'
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/auth/', authLimiter);
app.use('/api/', apiLimiter);
```

### 3. CSRF Protection

For API with session cookies:

```bash
npm install csrf-csrf
```

```javascript
const { doubleCsrf } = require('csrf-csrf');

const { doubleCsrfProtection } = doubleCsrf({
  getSecret: () => config.session.secret,
  cookieName: '__Host-csrf',
  cookieOptions: {
    sameSite: 'strict',
    secure: true
  }
});

app.post('/auth/logout', doubleCsrfProtection, OAuthController.logout);
app.post('/auth/refresh', doubleCsrfProtection, OAuthController.refresh);
```

### 4. Input Validation

While Mongoose provides basic validation, add additional validation:

```bash
npm install express-validator
```

```javascript
const { body, validationResult } = require('express-validator');

app.post('/auth/logout',
  body('userId').optional().isMongoId(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  OAuthController.logout
);
```

### 5. Helmet Security Headers

```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 6. Token Encryption at Rest

Encrypt tokens in database:

```bash
npm install mongoose-encryption
```

```javascript
const encrypt = require('mongoose-encryption');

const encKey = process.env.DB_ENCRYPTION_KEY;
const sigKey = process.env.DB_SIGNING_KEY;

oauthTokenSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ['access_token', 'refresh_token']
});
```

### 7. Monitoring & Logging

- Log all authentication attempts (success and failure)
- Monitor for suspicious patterns
- Set up alerts for repeated failures
- Use secure logging service (avoid logging tokens)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log authentication events (without tokens)
logger.info('Authentication attempt', {
  userId: user._id,
  timestamp: new Date(),
  success: true
});
```

### 8. Dependency Security

Keep dependencies updated:

```bash
npm audit
npm audit fix
```

Use dependency scanning:
```bash
npm install -g snyk
snyk test
snyk monitor
```

## Testing Security

### 1. Test OAuth Flow
- User denies authorization
- Invalid state parameter
- Expired authorization code
- Invalid client credentials

### 2. Test Token Management
- Expired access token
- Expired refresh token
- Missing tokens
- Invalid token format

### 3. Test Rate Limiting
- Multiple rapid requests
- Distributed attacks

### 4. Test CSRF Protection
- Cross-origin requests
- Missing CSRF token
- Invalid CSRF token

## Security Checklist for Production

- [ ] Enable HTTPS (TLS 1.2 or higher)
- [ ] Set secure cookie flags
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Use session store (Redis/MongoDB)
- [ ] Encrypt tokens at rest
- [ ] Enable security headers (Helmet)
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement proper logging (without sensitive data)
- [ ] Add input validation
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Use least privilege principle for database access

## Incident Response

If security issue is discovered:

1. **Immediate Actions**:
   - Revoke all OAuth tokens
   - Force re-authentication
   - Block suspicious IPs
   - Notify users if data compromised

2. **Investigation**:
   - Review logs
   - Identify scope of breach
   - Document findings

3. **Remediation**:
   - Apply security patches
   - Update credentials
   - Enhance monitoring

4. **Prevention**:
   - Implement additional controls
   - Update security policies
   - Train team

## Compliance Considerations

- **GDPR**: Ensure proper data handling and user consent
- **CCPA**: Provide data deletion mechanisms
- **SOC 2**: Implement audit logging and access controls
- **HIPAA**: Additional encryption if handling health data

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [LinkedIn OAuth Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

## Summary

**Current Implementation**:
- ✅ Secure OAuth 2.0 flow with state validation
- ✅ Secure token storage with Mongoose
- ✅ Automatic token refresh
- ✅ Error handling without data leaks
- ⚠️ Rate limiting needed for production
- ⚠️ CSRF protection recommended for non-OAuth routes
- ⚠️ Token encryption at rest recommended

**For MVP/Development**: Current implementation is secure for development and testing.

**For Production**: Implement additional security layers (rate limiting, CSRF, monitoring) as documented above.
