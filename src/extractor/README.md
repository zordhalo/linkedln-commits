# LinkedIn Data Extractor

Core module for extracting LinkedIn profile and activity data.

## ⚠️ Important Limitations

Based on research documented in [issue #4](https://github.com/zordhalo/linkedln-commits/issues/4), LinkedIn's API has significant restrictions:

- **Open permissions** (profile, email, w_member_social) do NOT include activity feed/history
- **Activity data APIs** require LinkedIn Partner Program approval
- Most activity-related endpoints are currently **unavailable** without partner access

## Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| `fetchUserProfile()` | ✅ Working | Uses OAuth userinfo endpoint |
| `fetchActivityPosts()` | ⚠️ Placeholder | Requires Partner Program |
| `fetchInteractions()` | ⚠️ Placeholder | Requires Partner Program |

## Features

### ✅ Implemented

1. **User Profile Fetching** - Works with current OAuth permissions
2. **Error Handling** - Comprehensive error handling with detailed messages
3. **Retry Logic** - Automatic retry with exponential backoff for transient failures
4. **Rate Limiting** - Built-in rate limiter to respect API limits
5. **Consistent JSON Format** - All responses follow a standard structure
6. **Token Management** - Integrates with existing OAuth service for automatic token refresh

### ⚠️ Placeholder (Awaiting Partner API Access)

- Activity posts history
- Interaction history (likes, comments)

## Installation

The module is already included in the project. No additional installation needed.

## Usage

### Basic Example

```javascript
const LinkedInExtractor = require('./src/extractor/LinkedInExtractor');

// Create extractor for a user
const extractor = new LinkedInExtractor(userId, {
  maxRequests: 100,      // Max requests per window
  windowMs: 60000,       // Rate limit window in ms
  retryOptions: {
    maxRetries: 3,       // Number of retry attempts
    retryDelay: 1000,    // Initial delay between retries
    backoffMultiplier: 2 // Exponential backoff multiplier
  }
});

// Validate configuration
const validation = await extractor.validate();
if (!validation.valid) {
  console.error('Extractor not properly configured');
  return;
}

// Fetch user profile (works with current permissions)
const profile = await extractor.fetchUserProfile();
console.log(profile);
```

### Fetch User Profile

```javascript
const profile = await extractor.fetchUserProfile();

// Response format:
{
  success: true,
  data: {
    id: 'linkedin-user-id',
    name: 'John Doe',
    email: 'john@example.com',
    picture: 'https://...',
    locale: 'en-US',
    email_verified: true
  },
  timestamp: '2024-10-28T12:00:00.000Z',
  source: 'linkedin_oauth'
}
```

### Fetch Activity Posts (Currently Limited)

```javascript
const posts = await extractor.fetchActivityPosts({
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  limit: 50
});

// Current response:
{
  success: false,
  error: {
    code: 'API_LIMITATION',
    message: 'LinkedIn activity feed access requires Partner Program approval',
    details: [...],
    alternatives: [
      'Manual data upload feature',
      'Browser extension for user-authorized extraction',
      ...
    ]
  },
  requestedParams: {...},
  timestamp: '2024-10-28T12:00:00.000Z',
  source: 'linkedin_api_stub'
}
```

### Extract All Data

```javascript
const allData = await extractor.extractAllData({
  posts: {
    startDate: new Date('2024-01-01'),
    endDate: new Date(),
    limit: 50
  },
  interactions: {
    startDate: new Date('2024-01-01'),
    endDate: new Date(),
    types: ['likes', 'comments'],
    limit: 100
  }
});

// Returns combined results with profile, posts, and interactions
```

## Running Examples

```bash
# Run the extractor usage example
npm run example:extractor
```

This will demonstrate all extractor features and show current limitations.

## Response Format

All methods return consistent JSON responses:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-10-28T12:00:00.000Z",
  "source": "linkedin_oauth"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "method": "methodName",
    "details": { ... }
  },
  "timestamp": "2024-10-28T12:00:00.000Z"
}
```

### Limitation Response
```json
{
  "success": false,
  "error": {
    "code": "API_LIMITATION",
    "message": "Feature requires Partner Program approval",
    "details": [...],
    "alternatives": [...]
  },
  "requestedParams": {...},
  "timestamp": "2024-10-28T12:00:00.000Z",
  "source": "linkedin_api_stub"
}
```

## Configuration Options

### Constructor Options

```javascript
new LinkedInExtractor(userId, {
  maxRequests: 100,        // Maximum requests per time window
  windowMs: 60000,         // Time window in milliseconds (default: 1 minute)
  retryOptions: {
    maxRetries: 3,         // Maximum retry attempts
    retryDelay: 1000,      // Initial delay in ms
    backoffMultiplier: 2,  // Exponential backoff multiplier
    retryableErrors: [     // Error codes to retry
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ]
  }
})
```

## Error Handling

The extractor includes comprehensive error handling:

1. **Authentication Errors** - Handled via OAuth service
2. **Network Errors** - Automatic retry with exponential backoff
3. **Rate Limiting** - Automatic request queuing
4. **API Errors** - Detailed error messages with response data
5. **Validation Errors** - Configuration and token validation

## Alternative Approaches for MVP

Since full activity data is not available, consider these alternatives:

1. **Manual Data Upload**
   - Allow users to export LinkedIn data manually
   - Implement CSV/JSON upload feature

2. **Browser Extension**
   - User-authorized data extraction from their own LinkedIn session
   - Respects user privacy and LinkedIn TOS

3. **GitHub-Only Tracking**
   - Focus on GitHub activity visualization for MVP
   - Add LinkedIn when Partner API access is granted

4. **Partner Program Application**
   - Apply for LinkedIn Partner Program
   - Request access to activity data APIs

## Integration with Storage

The extractor is designed to work with the existing database models:

```javascript
const { User, Activity } = require('../database/models');

// After fetching data, store in database
const profile = await extractor.fetchUserProfile();
if (profile.success) {
  await User.updateOne(
    { _id: userId },
    { $set: { last_sync: new Date() } }
  );
}
```

## Rate Limiting

Built-in rate limiter prevents exceeding API limits:

- Default: 100 requests per minute
- Configurable per instance
- Automatic request queuing
- Respects LinkedIn's rate limits

## Retry Logic

Automatic retry for transient failures:

- Exponential backoff (default: 1s, 2s, 4s)
- Configurable retry attempts
- Smart error detection (only retries recoverable errors)
- Detailed error logging

## Security

- Uses existing OAuth service for secure token management
- No credentials stored in extractor
- Automatic token refresh via OAuth service
- Respects LinkedIn API security requirements

## Future Enhancements

When Partner API access is granted:

1. Implement actual activity post fetching
2. Implement interaction history fetching
3. Add pagination support
4. Add advanced filtering options
5. Add caching layer
6. Add webhook support for real-time updates

## Related Documentation

- [LinkedIn API Research](../../docs/linkedin-api-research.md) - Detailed API research
- [OAuth Documentation](../api/README.md) - OAuth implementation details
- [Database Schema](../../docs/database-schema.md) - Database models
- [Issue #4](https://github.com/zordhalo/linkedln-commits/issues/4) - Original research

## Support

For questions or issues:
- Review the API research in issue #4
- Check the example usage script
- See OAuth documentation for authentication issues

## License

ISC
