# 📧 Email API Quick Reference

## Base URL
```
http://localhost:8000/api/v1/email
```

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Quick Start

### 1. Send a Simple Email
```bash
curl -X POST http://localhost:8000/api/v1/email/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Hello World",
    "template": "simple",
    "data": {
      "message": "Hello from KleverBot!"
    }
  }'
```

### 2. Get Email History
```bash
curl -X GET "http://localhost:8000/api/v1/email/history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Create Email Template
```bash
curl -X POST http://localhost:8000/api/v1/email/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "welcome",
    "subject": "Welcome {{name}}!",
    "htmlContent": "<h1>Hello {{name}}!</h1>",
    "category": "notification"
  }'
```

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/send` | Send single email |
| `POST` | `/bulk` | Send bulk emails |
| `POST` | `/queue` | Schedule email |
| `GET` | `/history` | Get email history |
| `GET` | `/history/stats` | Get statistics |
| `GET` | `/history/:id` | Get email details |
| `POST` | `/history/:id/retry` | Retry failed email |
| `GET` | `/templates` | List templates |
| `POST` | `/templates` | Create template |
| `GET` | `/templates/:id` | Get template |
| `PUT` | `/templates/:id` | Update template |
| `DELETE` | `/templates/:id` | Delete template |
| `POST` | `/templates/:id/preview` | Preview template |
| `POST` | `/templates/:id/test` | Test template |

## Email Object Structure

```json
{
  "to": "user@example.com",
  "cc": ["cc1@example.com"],
  "bcc": ["bcc1@example.com"],
  "subject": "Email Subject",
  "template": "template-name",
  "data": {
    "variable1": "value1",
    "variable2": "value2"
  },
  "category": "notification|marketing|transactional|security|system",
  "priority": "low|normal|high|urgent",
  "scheduledAt": "2025-12-25T10:00:00Z",
  "trackOpens": true,
  "trackClicks": true,
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-content",
      "contentType": "application/pdf"
    }
  ]
}
```

## Template Object Structure

```json
{
  "name": "template-name",
  "subject": "Subject with {{variables}}",
  "htmlContent": "<html>HTML content with {{variables}}</html>",
  "textContent": "Text content with {{variables}}",
  "category": "notification",
  "variables": ["variable1", "variable2"],
  "description": "Template description",
  "status": "active|inactive|draft"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Error description",
    "details": {
      // Error details
    }
  }
}
```

## Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `422` | Validation Error |
| `429` | Rate Limited |
| `500` | Server Error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/send` | 50 requests per 15 minutes |
| `/bulk` | 5 requests per hour |
| `/queue` | 100 requests per 15 minutes |
| `/templates/*` | 20 requests per minute |
| `/history/*` | 100 requests per minute |

## Email Categories

- `notification` - System notifications
- `marketing` - Marketing campaigns  
- `transactional` - Transaction confirmations
- `security` - Security alerts
- `system` - System messages

## Email Priorities

- `low` - Non-urgent emails (processed when resources available)
- `normal` - Standard priority (default)
- `high` - Important emails (higher queue priority)
- `urgent` - Critical emails (immediate processing)

## Email Statuses

- `queued` - Waiting to be sent
- `sending` - Currently being processed
- `sent` - Successfully sent to provider
- `delivered` - Confirmed delivery
- `opened` - Email was opened
- `clicked` - Links were clicked
- `bounced` - Delivery failed
- `failed` - Send failed
- `spam` - Marked as spam

## Common Examples

### Send Welcome Email
```javascript
const response = await fetch('/api/v1/email/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'newuser@example.com',
    template: 'welcome',
    data: {
      name: 'John Doe',
      loginUrl: 'https://app.kleverbot.com/login'
    },
    category: 'notification'
  })
});
```

### Send Marketing Campaign
```javascript
const emails = users.map(user => ({
  to: user.email,
  template: 'newsletter',
  data: {
    name: user.name,
    unsubscribeUrl: `https://app.kleverbot.com/unsubscribe/${user.id}`
  }
}));

const response = await fetch('/api/v1/email/bulk', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    emails,
    category: 'marketing',
    priority: 'low'
  })
});
```

### Get Email Analytics
```javascript
const stats = await fetch('/api/v1/email/history/stats?period=30d', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const data = await stats.json();
console.log('Open Rate:', data.data.overview.openRate + '%');
```

For detailed documentation, see [EMAIL_MODULE.md](EMAIL_MODULE.md)