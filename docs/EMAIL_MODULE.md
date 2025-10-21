# 📧 Email Module Documentation

## Overview

The Email Module provides a comprehensive email management system with advanced features for sending, tracking, templating, and analytics. It's designed to handle everything from simple transactional emails to complex marketing campaigns.

## Architecture

```
src/modules/email/
├── EmailModule.js                 # Main orchestrator
├── index.js                      # Module exports
├── controllers/                  # API request handlers
│   ├── EmailController.js        # Email sending endpoints
│   ├── EmailHistoryController.js # History & analytics
│   ├── EmailTemplateController.js# Template management
│   └── TestController.js         # Testing utilities
├── services/                     # Business logic
│   ├── EmailTemplateService.js   # Template CRUD & rendering
│   ├── EmailHistoryService.js    # Tracking & analytics
│   ├── MailService.js            # Email sending
│   └── PasswordResetService.js   # Password reset emails
├── models/                       # Database models
│   └── EmailHistory.js           # Email tracking model
├── routes/                       # API routing
│   └── emailRoutes.js             # All email endpoints
├── repositories/                 # Data access layer
│   ├── EmailHistoryRepository.js
│   └── EmailTemplateRepository.js
├── validators/                   # Input validation
│   ├── emailValidators.js
│   └── templateValidators.js
└── templates/                    # Email templates
    ├── layouts/                  # Base layouts
    ├── partials/                 # Reusable components
    └── default/                  # Default templates
```

## Features

### 🚀 Email Sending
- **Single Email**: Send individual emails with full customization
- **Bulk Emails**: Send multiple emails efficiently with batch processing
- **Scheduled Emails**: Queue emails for future delivery
- **Priority Handling**: Different priority levels (low, normal, high, urgent)
- **Template Rendering**: Dynamic content with Handlebars templates
- **Multiple Providers**: Support for various SMTP providers
- **Rate Limiting**: Prevent spam and respect provider limits

### 📊 Email Tracking & Analytics
- **Delivery Tracking**: Track email status from queue to delivery
- **Open Tracking**: Pixel-based email open detection
- **Click Tracking**: Track link clicks within emails
- **Bounce Handling**: Manage bounced and failed emails
- **Statistics**: Comprehensive analytics and reporting
- **Search & Filter**: Advanced search across email history
- **Retry Logic**: Automatic retry for failed emails

### 🎨 Template Management
- **Dynamic Templates**: Handlebars-based templating system
- **CRUD Operations**: Full template lifecycle management
- **Template Validation**: Syntax and variable validation
- **CSS Inlining**: Automatic CSS inlining for email compatibility
- **Preview & Testing**: Preview templates before sending
- **Version Control**: Template versioning and rollback
- **Categorization**: Organize templates by category

### 🔔 Notifications & Webhooks
- **Event Webhooks**: Real-time notifications for email events
- **Batch Notifications**: Send notifications to multiple recipients
- **Custom Events**: Define custom email events
- **Webhook Security**: Signed webhooks for security

## Database Schema

### EmailHistory Table

```sql
CREATE TABLE email_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(255) UNIQUE,
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255),
  subject VARCHAR(500),
  template_name VARCHAR(100),
  status email_status DEFAULT 'queued',
  category email_category DEFAULT 'notification',
  priority email_priority DEFAULT 'normal',
  provider VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  tracking_pixel_url VARCHAR(500),
  click_tracking BOOLEAN DEFAULT false,
  open_tracking BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enums

```sql
-- Email Status
CREATE TYPE email_status AS ENUM (
  'queued', 'sending', 'sent', 'delivered', 
  'opened', 'clicked', 'bounced', 'failed', 'spam'
);

-- Email Category
CREATE TYPE email_category AS ENUM (
  'notification', 'marketing', 'transactional', 
  'security', 'system'
);

-- Email Priority
CREATE TYPE email_priority AS ENUM (
  'low', 'normal', 'high', 'urgent'
);
```

## API Endpoints

### Email Sending

#### POST /api/v1/email/send
Send a single email with template support.

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to KleverBot",
  "template": "welcome",
  "data": {
    "name": "John Doe",
    "appName": "KleverBot"
  },
  "category": "notification",
  "priority": "normal",
  "scheduledAt": "2025-12-25T10:00:00Z",
  "trackOpens": true,
  "trackClicks": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "messageId": "msg_123456789",
    "status": "sent",
    "scheduledAt": null,
    "estimatedDelivery": "2025-10-21T15:35:00Z"
  }
}
```

#### POST /api/v1/email/bulk
Send multiple emails efficiently.

**Request Body:**
```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Newsletter #1",
      "template": "newsletter",
      "data": { "name": "User 1" }
    },
    {
      "to": "user2@example.com",
      "subject": "Newsletter #2", 
      "template": "newsletter",
      "data": { "name": "User 2" }
    }
  ],
  "category": "marketing",
  "priority": "low",
  "batchSize": 10,
  "delayBetweenBatches": 1000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk email operation initiated",
  "data": {
    "totalEmails": 2,
    "successCount": 2,
    "failedCount": 0,
    "batchId": "batch_123456",
    "estimatedCompletion": "2025-10-21T15:40:00Z",
    "results": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "to": "user1@example.com",
        "status": "queued"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "to": "user2@example.com", 
        "status": "queued"
      }
    ]
  }
}
```

### Email History & Analytics

#### GET /api/v1/email/history
Retrieve email history with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status
- `category` (string): Filter by category
- `priority` (string): Filter by priority
- `dateFrom` (string): Start date (ISO format)
- `dateTo` (string): End date (ISO format)
- `search` (string): Search in subject, to_email
- `sortBy` (string): Sort field (default: created_at)
- `sortOrder` (string): Sort order (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "emails": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "messageId": "msg_123456789",
        "toEmail": "user@example.com",
        "fromEmail": "noreply@kleverbot.com",
        "subject": "Welcome to KleverBot",
        "templateName": "welcome",
        "status": "delivered",
        "category": "notification",
        "priority": "normal",
        "provider": "smtp",
        "sentAt": "2025-10-21T15:30:00Z",
        "deliveredAt": "2025-10-21T15:30:15Z",
        "openedAt": "2025-10-21T15:35:00Z",
        "retryCount": 0,
        "trackingPixelUrl": "https://api.kleverbot.com/track/open/abc123",
        "createdAt": "2025-10-21T15:29:45Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 95,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### GET /api/v1/email/history/stats
Get comprehensive email statistics.

**Query Parameters:**
- `period` (string): Time period (1d, 7d, 30d, 90d, 1y)
- `category` (string): Filter by category
- `groupBy` (string): Group by (hour, day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalSent": 1250,
      "totalDelivered": 1198,
      "totalOpened": 745,
      "totalClicked": 156,
      "totalBounced": 12,
      "totalFailed": 40,
      "deliveryRate": 95.84,
      "openRate": 62.19,
      "clickRate": 20.94,
      "bounceRate": 0.96
    },
    "trends": [
      {
        "date": "2025-10-21",
        "sent": 85,
        "delivered": 82,
        "opened": 51,
        "clicked": 12,
        "bounced": 1,
        "failed": 2
      }
    ],
    "categoryBreakdown": [
      {
        "category": "notification",
        "count": 650,
        "percentage": 52.0
      },
      {
        "category": "marketing", 
        "count": 400,
        "percentage": 32.0
      }
    ],
    "topTemplates": [
      {
        "templateName": "welcome",
        "count": 245,
        "openRate": 78.4,
        "clickRate": 25.3
      }
    ]
  }
}
```

### Template Management

#### POST /api/v1/email/templates
Create a new email template.

**Request Body:**
```json
{
  "name": "welcome-email",
  "subject": "Welcome to {{appName}}!",
  "htmlContent": "<h1>Hello {{name}}!</h1><p>Welcome to our platform.</p>",
  "textContent": "Hello {{name}}! Welcome to our platform.",
  "category": "notification",
  "variables": ["name", "appName"],
  "description": "Welcome email for new users",
  "isDefault": false,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "id": "template_123456",
    "name": "welcome-email",
    "subject": "Welcome to {{appName}}!",
    "category": "notification",
    "variables": ["name", "appName"],
    "status": "active",
    "version": 1,
    "createdAt": "2025-10-21T15:30:00Z"
  }
}
```

#### POST /api/v1/email/templates/:id/preview
Preview a template with sample data.

**Request Body:**
```json
{
  "data": {
    "name": "John Doe",
    "appName": "KleverBot"
  },
  "format": "html"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subject": "Welcome to KleverBot!",
    "htmlContent": "<h1>Hello John Doe!</h1><p>Welcome to our platform.</p>",
    "textContent": "Hello John Doe! Welcome to our platform.",
    "usedVariables": ["name", "appName"],
    "missingVariables": []
  }
}
```

## Configuration

### Environment Variables

```env
# SMTP Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM_NAME=KleverBot
MAIL_FROM_ADDRESS=noreply@kleverbot.com
MAIL_REPLY_TO=support@kleverbot.com

# Email Settings
EMAIL_QUEUE_CONCURRENCY=5
EMAIL_RATE_LIMIT_PER_MINUTE=100
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_DELAY=300000
EMAIL_BATCH_SIZE=50
EMAIL_TRACKING_DOMAIN=track.kleverbot.com

# Template Settings
TEMPLATE_CACHE_TTL=3600
TEMPLATE_COMPILE_TIMEOUT=5000
```

### Mail Configuration

The email module uses the configuration from `src/config/mail.js`:

```javascript
module.exports = {
  default: process.env.MAIL_MAILER || 'smtp',
  
  mailers: {
    smtp: {
      transport: 'smtp',
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    }
  },
  
  from: {
    address: process.env.MAIL_FROM_ADDRESS,
    name: process.env.MAIL_FROM_NAME || 'KleverBot'
  },
  
  replyTo: process.env.MAIL_REPLY_TO
};
```

## Usage Examples

### Basic Email Sending

```javascript
const { EmailModule } = require('@/modules/email');

// Send a simple email
const result = await EmailModule.sendEmail({
  to: 'user@example.com',
  subject: 'Hello World',
  template: 'simple',
  data: { message: 'Hello from KleverBot!' }
});

console.log('Email sent:', result.messageId);
```

### Bulk Email Campaign

```javascript
const recipients = [
  { email: 'user1@example.com', name: 'User 1' },
  { email: 'user2@example.com', name: 'User 2' }
];

const emails = recipients.map(user => ({
  to: user.email,
  subject: 'Monthly Newsletter',
  template: 'newsletter',
  data: { name: user.name }
}));

const result = await EmailModule.sendBulkEmails({
  emails,
  category: 'marketing',
  batchSize: 10
});

console.log('Bulk send initiated:', result.batchId);
```

### Template Management

```javascript
const { EmailTemplateService } = require('@/modules/email/services');

// Create a new template
const template = await EmailTemplateService.createTemplate({
  name: 'order-confirmation',
  subject: 'Order #{{orderNumber}} Confirmed',
  htmlContent: `
    <h1>Order Confirmation</h1>
    <p>Hello {{customerName}},</p>
    <p>Your order #{{orderNumber}} has been confirmed.</p>
    <p>Total: ${{orderTotal}}</p>
  `,
  variables: ['customerName', 'orderNumber', 'orderTotal'],
  category: 'transactional'
});

// Render template with data
const rendered = await EmailTemplateService.renderTemplate(
  template.id,
  {
    customerName: 'John Doe',
    orderNumber: '12345',
    orderTotal: '99.99'
  }
);
```

### Email Tracking

```javascript
const { EmailHistoryService } = require('@/modules/email/services');

// Get email statistics for last 30 days
const stats = await EmailHistoryService.getStatistics({
  period: '30d',
  category: 'marketing'
});

console.log('Open rate:', stats.overview.openRate + '%');
console.log('Click rate:', stats.overview.clickRate + '%');

// Search email history
const results = await EmailHistoryService.searchEmails({
  query: 'welcome',
  filters: {
    status: ['delivered', 'opened'],
    dateRange: {
      start: '2025-10-01',
      end: '2025-10-21'
    }
  }
});
```

## Error Handling

The email module provides comprehensive error handling:

### Error Types

1. **ValidationError**: Invalid input data
2. **TemplateError**: Template compilation or rendering issues
3. **SendingError**: SMTP or provider errors
4. **RateLimitError**: Rate limit exceeded
5. **QuotaError**: Email quota exceeded

### Error Response Format

```json
{
  "success": false,
  "error": {
    "type": "ValidationError",
    "message": "Invalid email address format",
    "details": {
      "field": "to",
      "value": "invalid-email",
      "constraint": "email"
    }
  }
}
```

## Security Considerations

### Rate Limiting
- API endpoints are rate-limited to prevent abuse
- Different limits for different operations
- Per-user and global rate limiting

### Input Validation
- All inputs are validated using express-validator
- Email addresses are sanitized and validated
- Template content is sanitized to prevent XSS

### Authentication
- All endpoints require JWT authentication
- Role-based access control for administrative functions
- API key authentication for webhook endpoints

### Data Privacy
- Email content is not logged in production
- Personal data handling complies with privacy regulations
- Secure webhook signing for external integrations

## Performance Optimization

### Caching
- Template compilation results are cached
- Database query results are cached where appropriate
- Redis caching for high-performance scenarios

### Queue Management
- Background job processing for bulk operations
- Priority queue for urgent emails
- Dead letter queue for failed emails

### Database Optimization
- Proper indexing on frequently queried fields
- Partitioning for large email history tables
- Archive old data to maintain performance

## Monitoring & Observability

### Metrics
- Email sending rates and success rates
- Template rendering performance
- Queue depth and processing times
- Error rates by category and type

### Logging
- Structured logging with correlation IDs
- Email delivery tracking logs
- Error logs with full context
- Performance metrics logging

### Health Checks
- SMTP connectivity health checks
- Database connectivity monitoring
- Queue health monitoring
- Template compilation health checks

## Testing

### Unit Tests
Run unit tests for individual components:

```bash
npm test src/modules/email/services/EmailTemplateService.test.js
npm test src/modules/email/services/EmailHistoryService.test.js
```

### Integration Tests
Test the full email sending flow:

```bash
npm test src/modules/email/integration/
```

### Load Testing
Test email sending under load:

```bash
npm run test:load -- --target http://localhost:8000/api/v1/email
```

## Troubleshooting

### Common Issues

1. **SMTP Connection Errors**
   - Check SMTP credentials in environment variables
   - Verify firewall and network connectivity
   - Test with different SMTP providers

2. **Template Rendering Errors**
   - Validate Handlebars syntax
   - Check variable names and data structure
   - Review template compilation logs

3. **High Email Bounce Rates**
   - Validate email addresses before sending
   - Check sender reputation and domain setup
   - Review email content for spam indicators

4. **Performance Issues**
   - Monitor queue depth and processing times
   - Check database query performance
   - Review rate limiting configuration

### Debug Mode
Enable debug logging:

```env
DEBUG=email:*
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting email-related issues.

---

For more information, see the [main README](../README.md) or contact the development team.