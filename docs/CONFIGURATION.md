# 🔧 Configuration Guide

## Environment Variables

### Core Application Settings

```env
# Application
NODE_ENV=development
PORT=8000
APP_NAME=KleverBot
APP_URL=http://localhost:8000

# Security
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Configuration

```env
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kleverbot
DB_USER=postgres
DB_PASS=your-database-password
DB_SSL=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# Database URLs (alternative)
DATABASE_URL=postgresql://user:password@localhost:5432/kleverbot
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/kleverbot_test
```

### Email Configuration

```env
# SMTP Settings
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Email Identity
MAIL_FROM_NAME=KleverBot
MAIL_FROM_ADDRESS=noreply@kleverbot.com
MAIL_REPLY_TO=support@kleverbot.com

# Email Features
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

### Logging Configuration

```env
# Winston Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
LOG_ERROR_FILE=logs/error.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# Debug Mode
DEBUG=app:*,email:*
```

### Cache Configuration

```env
# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=kleverbot:

# Cache Settings
CACHE_TTL=3600
CACHE_MAX_KEYS=1000
```

## Configuration Files

### Database Configuration (`src/config/database.js`)

```javascript
const config = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    ssl: process.env.DB_SSL === 'true',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

module.exports = config;
```

### Email Configuration (`src/config/mail.js`)

```javascript
module.exports = {
  default: process.env.MAIL_MAILER || 'smtp',
  
  mailers: {
    smtp: {
      transport: 'smtp',
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT) || 587,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    },
    
    sendgrid: {
      transport: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY
    },
    
    mailgun: {
      transport: 'mailgun',
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  },
  
  from: {
    address: process.env.MAIL_FROM_ADDRESS,
    name: process.env.MAIL_FROM_NAME || 'KleverBot'
  },
  
  replyTo: process.env.MAIL_REPLY_TO,
  
  queue: {
    concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY) || 5,
    batchSize: parseInt(process.env.EMAIL_BATCH_SIZE) || 50,
    rateLimitPerMinute: parseInt(process.env.EMAIL_RATE_LIMIT_PER_MINUTE) || 100
  },
  
  retry: {
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES) || 3,
    delay: parseInt(process.env.EMAIL_RETRY_DELAY) || 300000
  },
  
  tracking: {
    domain: process.env.EMAIL_TRACKING_DOMAIN,
    openTracking: true,
    clickTracking: true
  }
};
```

### Environment Configuration (`src/config/environment.js`)

```javascript
module.exports = {
  // App Settings
  app: {
    name: process.env.APP_NAME || 'KleverBot',
    url: process.env.APP_URL || 'http://localhost:8000',
    port: parseInt(process.env.PORT) || 8000,
    env: process.env.NODE_ENV || 'development'
  },

  // JWT Settings
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Security Settings
  security: {
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    trustProxy: process.env.TRUST_PROXY === 'true'
  },

  // Feature Flags
  features: {
    emailModule: process.env.FEATURE_EMAIL_MODULE !== 'false',
    userRegistration: process.env.FEATURE_USER_REGISTRATION !== 'false',
    passwordReset: process.env.FEATURE_PASSWORD_RESET !== 'false',
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION !== 'false'
  }
};
```

## Provider-Specific Setup

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication** in your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Environment Variables**:
   ```env
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_SECURE=false
   MAIL_USER=your-email@gmail.com
   MAIL_PASS=your-16-character-app-password
   ```

### SendGrid Setup

1. **Create SendGrid Account** and get API key
2. **Environment Variables**:
   ```env
   MAIL_MAILER=sendgrid
   SENDGRID_API_KEY=your-sendgrid-api-key
   MAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

### Mailgun Setup

1. **Create Mailgun Account** and verify domain
2. **Environment Variables**:
   ```env
   MAIL_MAILER=mailgun
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=mg.yourdomain.com
   MAIL_FROM_ADDRESS=noreply@yourdomain.com
   ```

### Amazon SES Setup

1. **Configure AWS SES** and verify domain/email
2. **Environment Variables**:
   ```env
   MAIL_HOST=email-smtp.us-east-1.amazonaws.com
   MAIL_PORT=587
   MAIL_SECURE=false
   MAIL_USER=your-ses-access-key
   MAIL_PASS=your-ses-secret-key
   ```

## Development vs Production

### Development Configuration

```env
NODE_ENV=development
LOG_LEVEL=debug
DB_LOGGING=true
RATE_LIMIT_MAX_REQUESTS=1000
EMAIL_QUEUE_CONCURRENCY=1
DEBUG=app:*,email:*
```

### Production Configuration

```env
NODE_ENV=production
LOG_LEVEL=info
DB_LOGGING=false
DB_SSL=true
RATE_LIMIT_MAX_REQUESTS=100
EMAIL_QUEUE_CONCURRENCY=5
TRUST_PROXY=true

# Security Headers
HELMET_ENABLED=true
CORS_CREDENTIALS=true
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      PORT: 8000
      DB_HOST: postgres
      DB_NAME: kleverbot
      DB_USER: postgres
      DB_PASS: password
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: kleverbot
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

USER node

CMD ["npm", "start"]
```

## Security Best Practices

### Environment Variables Security

1. **Never commit `.env` files** to version control
2. **Use strong secrets** for JWT tokens (at least 32 characters)
3. **Rotate secrets regularly** in production
4. **Use different secrets** for different environments
5. **Store production secrets** in secure key management systems

### Database Security

1. **Use SSL connections** in production
2. **Create dedicated database user** with minimal permissions
3. **Enable query logging** for audit trails
4. **Regular backups** and test restore procedures
5. **Network isolation** for database servers

### Email Security

1. **Use App Passwords** instead of account passwords
2. **Enable SPF, DKIM, DMARC** records for your domain
3. **Monitor bounce rates** and reputation
4. **Implement rate limiting** to prevent abuse
5. **Validate email addresses** before sending

## Monitoring & Health Checks

### Health Check Endpoint

The application provides a health check endpoint at `/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T15:30:00Z",
  "uptime": 3600,
  "services": {
    "database": "healthy",
    "email": "healthy",
    "cache": "healthy"
  }
}
```

### Monitoring Configuration

```env
# Health Check Settings
HEALTH_CHECK_TIMEOUT=5000
HEALTH_CHECK_INTERVAL=30000

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PATH=/metrics

# Alerting
ALERT_EMAIL=admin@kleverbot.com
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database server status
   - Verify connection credentials
   - Test network connectivity

2. **Email Sending Failed**
   - Verify SMTP credentials
   - Check provider rate limits
   - Review email content for spam triggers

3. **JWT Token Issues**
   - Ensure secrets are consistent across instances
   - Check token expiration settings
   - Verify token signing algorithm

4. **Rate Limiting Too Strict**
   - Review rate limit settings
   - Check for legitimate high-traffic scenarios
   - Implement IP whitelisting if needed

### Debug Mode

Enable debug logging for specific modules:

```env
DEBUG=app:*,email:*,db:*
LOG_LEVEL=debug
```

This will provide detailed logs for troubleshooting issues.

---

For more configuration examples and advanced setups, see the [main documentation](../README.md).