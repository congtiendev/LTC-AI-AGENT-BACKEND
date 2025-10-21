# 🤖 KleverBot Backend API

A comprehensive Node.js backend API for KleverBot application with JWT authentication, role-based
access control, and PostgreSQL database.

## 🚀 Features

- **JWT Authentication** - Access & refresh tokens
- **Role-Based Access Control** - Admin, User, Moderator roles
- **📧 Email Module** - Comprehensive email management system
  - Email sending (single, bulk, scheduled)
  - Template management with Handlebars
  - Email history tracking & analytics
  - Advanced search & filtering
  - Rate limiting & queue management
  - Webhook support for email events
- **Multi-Login Support** - Login via username, email, or phone
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - Comprehensive validation with express-validator
- **Security Headers** - Helmet.js for security best practices
- **CORS Support** - Cross-origin resource sharing
- **Winston Logging** - Structured logging system
- **PostgreSQL + Sequelize** - Database ORM with migrations
- **Docker Support** - Containerized deployment
- **ESLint + Prettier** - Code quality and formatting

## � Table of Contents

- [🚀 Features](#-features)
- [📋 Prerequisites](#-prerequisites)
- [🛠️ Installation](#️-installation)
- [🗃️ Database Schema](#️-database-schema)
- [🔐 Authentication API](#-authentication-api)
- [📧 Email Module API](#-email-module-api)
- [🔧 Configuration](#-configuration)
- [📁 Project Structure](#-project-structure)
- [🐳 Docker Deployment](#-docker-deployment)
- [🤝 Contributing](#-contributing)

## 📖 Documentation

- [📧 Email Module Documentation](docs/EMAIL_MODULE.md) - Comprehensive email system guide
- [📋 API Reference](docs/API_REFERENCE.md) - Quick API reference
- [🔧 Configuration Guide](docs/CONFIGURATION.md) - Environment and setup guide

## �📋 Prerequisites

- **Node.js** v18.0.0 or higher
- **PostgreSQL** v12.0 or higher
- **npm** v8.0.0 or higher

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/congtiendev/LTC-AI-AGENT-BACKEND.git
   cd LTC-AI-AGENT-BACKEND
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env
   ```

   Update `.env` with your database credentials:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=kleverbot
   DB_USER=kleverbot_user
   DB_PASS=your_password

   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   ```

4. **Database Setup**

   ```bash
   # Create database
   createdb kleverbot

   # Run migrations
   npm run migrate

   # Seed database (optional)
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🗃️ Database Schema

### Users Table

- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `firstName` - User's first name
- `lastName` - User's last name
- `phone` - Phone number
- `status` - Account status (active/inactive/suspended)
- `emailVerified` - Email verification status
- `emailVerifiedAt` - Email verification timestamp
- `lastLoginAt` - Last login timestamp

### Roles & Permissions

- **Roles**: admin, user, moderator
- **Permissions**: CRUD operations on users, roles
- **UserRoles**: Many-to-many relationship
- **RolePermissions**: Many-to-many relationship

## 🔐 API Documentation

### Base URL

```
http://localhost:8000
```

### Authentication Endpoints

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0123456789"
}
```

#### Login (Multi-method)

```http
POST /api/v1/auth/login
Content-Type: application/json

// Login by email
{
  "account": "user@example.com",
  "password": "SecurePass123!"
}

// Login by username
{
  "account": "username",
  "password": "SecurePass123!"
}

// Login by phone
{
  "account": "0123456789",
  "password": "SecurePass123!"
}
```

#### Get Profile

```http
GET /api/v1/auth/profile
Authorization: Bearer <access_token>
```

#### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

#### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

## 📧 Email Module API

The Email Module provides comprehensive email management capabilities including sending, history tracking, template management, and analytics.

### Email Sending

#### Send Single Email

```http
POST /api/v1/email/send
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Welcome to KleverBot",
  "template": "welcome",
  "data": {
    "name": "John Doe",
    "loginUrl": "https://app.kleverbot.com"
  },
  "category": "notification",
  "priority": "normal"
}
```

#### Send Bulk Emails

```http
POST /api/v1/email/bulk
Authorization: Bearer <access_token>
Content-Type: application/json

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
  "priority": "low"
}
```

#### Queue Email for Later

```http
POST /api/v1/email/queue
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Scheduled Email",
  "template": "reminder",
  "data": { "eventDate": "2025-12-25" },
  "scheduledAt": "2025-12-24T10:00:00Z",
  "priority": "high"
}
```

### Email History & Analytics

#### Get Email History

```http
GET /api/v1/email/history?page=1&limit=20&status=sent&category=notification
Authorization: Bearer <access_token>
```

#### Get Email Statistics

```http
GET /api/v1/email/history/stats?period=7d&category=all
Authorization: Bearer <access_token>
```

#### Get Detailed Email by ID

```http
GET /api/v1/email/history/:id
Authorization: Bearer <access_token>
```

#### Retry Failed Email

```http
POST /api/v1/email/history/:id/retry
Authorization: Bearer <access_token>
```

#### Search Email History

```http
POST /api/v1/email/history/search
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "query": "welcome",
  "filters": {
    "status": ["sent", "delivered"],
    "dateRange": {
      "start": "2025-10-01",
      "end": "2025-10-21"
    },
    "category": "notification"
  }
}
```

### Email Templates

#### Get All Templates

```http
GET /api/v1/email/templates?category=notification&status=active
Authorization: Bearer <access_token>
```

#### Get Template by ID

```http
GET /api/v1/email/templates/:id
Authorization: Bearer <access_token>
```

#### Create New Template

```http
POST /api/v1/email/templates
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "welcome-email",
  "subject": "Welcome to {{appName}}!",
  "htmlContent": "<h1>Hello {{name}}!</h1><p>Welcome to our platform.</p>",
  "textContent": "Hello {{name}}! Welcome to our platform.",
  "category": "notification",
  "variables": ["name", "appName"],
  "description": "Welcome email for new users"
}
```

#### Update Template

```http
PUT /api/v1/email/templates/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "subject": "Updated Welcome Message",
  "htmlContent": "<h1>Hello {{name}}!</h1><p>Thanks for joining {{appName}}!</p>",
  "status": "active"
}
```

#### Delete Template

```http
DELETE /api/v1/email/templates/:id
Authorization: Bearer <access_token>
```

#### Preview Template

```http
POST /api/v1/email/templates/:id/preview
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "data": {
    "name": "John Doe",
    "appName": "KleverBot"
  }
}
```

#### Test Template

```http
POST /api/v1/email/templates/:id/test
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "to": "test@example.com",
  "data": {
    "name": "Test User",
    "appName": "KleverBot"
  }
}
```

### Email Notifications & Webhooks

#### Send Notification Batch

```http
POST /api/v1/email/notifications/batch
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "user_signup",
  "recipients": ["admin@example.com", "moderator@example.com"],
  "data": {
    "newUserEmail": "newuser@example.com",
    "signupDate": "2025-10-21T15:30:00Z"
  }
}
```

#### Configure Webhook

```http
POST /api/v1/email/webhooks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "url": "https://your-app.com/email-webhook",
  "events": ["delivered", "opened", "clicked", "bounced"],
  "secret": "your-webhook-secret"
}
```

### Email Categories & Settings

Available email categories:
- `notification` - System notifications
- `marketing` - Marketing campaigns  
- `transactional` - Transaction confirmations
- `security` - Security alerts
- `system` - System messages

Email priorities:
- `low` - Non-urgent emails
- `normal` - Standard priority (default)
- `high` - Important emails
- `urgent` - Critical emails

Email statuses:
- `queued` - Waiting to be sent
- `sending` - Currently being processed
- `sent` - Successfully sent to provider
- `delivered` - Confirmed delivery
- `opened` - Email was opened
- `clicked` - Links were clicked
- `bounced` - Delivery failed
- `failed` - Send failed
- `spam` - Marked as spam

### System Endpoints

#### Health Check

```http
GET /health
```

#### API Documentation

```http
GET /api/v1
```

## 👥 Test Users

| Role  | Username   | Email                | Phone        | Password       |
| ----- | ---------- | -------------------- | ------------ | -------------- |
| User  | `testuser` | `test@example.com`   | `0123456789` | `TestPass123!` |
| Admin | `admin`    | `admin@kleverbot.ai` | `0987654321` | `TestPass123!` |

## 🛡️ Security Features

### Rate Limiting

- **Register**: 3 requests per hour
- **Login**: 10 requests per 15 minutes
- **General**: 100 requests per 15 minutes

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

### JWT Configuration

- **Access Token**: 1 hour expiry
- **Refresh Token**: 30 days expiry
- RS256 algorithm
- Secure HTTP-only cookies (production)

## 📦 NPM Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Database
npm run migrate     # Run migrations
npm run migrate:undo # Undo last migration
npm run seed        # Run seeders

# Code Quality
npm run lint        # ESLint check
npm run lint:fix    # Fix ESLint issues
npm run format      # Prettier format

# Testing
npm test           # Run tests
npm run test:watch # Watch mode tests

# Docker
npm run docker:build # Build Docker image
npm run docker:up   # Start with Docker Compose
```

## 🐳 Docker Deployment

1. **Build and run with Docker Compose**

   ```bash
   docker-compose up -d
   ```

2. **Environment variables in docker-compose.yml**
   ```yaml
   environment:
     - NODE_ENV=production
     - DB_HOST=postgres
     - DB_NAME=kleverbot
   ```

## 📁 Project Structure

```
kleverbot-backend/
├── src/
│   ├── app.js                 # Express app configuration
│   ├── server.js             # Server entry point
│   ├── config/               # Configuration files
│   │   ├── database.js       # Database config
│   │   ├── environment.js    # Environment variables
│   │   └── index.js         # Config index
│   ├── controllers/          # Route controllers
│   │   └── AuthController.js
│   ├── middleware/           # Custom middleware
│   │   ├── auth.js          # JWT authentication
│   │   ├── cors.js          # CORS configuration
│   │   ├── errorHandler.js  # Error handling
│   │   ├── rateLimit.js     # Rate limiting
│   │   └── validation.js    # Input validation
│   ├── routes/              # Route definitions
│   │   ├── index.js
│   │   └── api/v1/
│   │       ├── index.js
│   │       └── auth.js
│   ├── services/            # Business logic
│   │   └── AuthService.js
│   ├── repositories/        # Data access layer
│   │   ├── BaseRepository.js
│   │   ├── UserRepository.js
│   │   └── RefreshTokenRepository.js
│   ├── database/            # Database related
│   │   ├── models/
│   │   ├── sequelize-models/
│   │   ├── sequelize-migrations/
│   │   └── sequelize-seeders/
│   ├── validators/          # Input validators
│   │   └── authValidators.js
│   └── utils/               # Utility functions
│       ├── logger.js
│       ├── responses.js
│       └── index.js
├── tests/                   # Test files
├── logs/                    # Log files
├── uploads/                 # File uploads
├── docs/                    # Documentation
├── .env                     # Environment variables
├── .env.example            # Environment template
├── docker-compose.yml      # Docker configuration
├── Dockerfile             # Docker image
└── README.md              # This file
```

## 🧪 Testing with Postman

1. **Import Environment**

   ```json
   {
     "name": "KleverBot Backend",
     "values": [
       { "key": "base_url", "value": "http://localhost:8000" },
       { "key": "access_token", "value": "" },
       { "key": "refresh_token", "value": "" }
     ]
   }
   ```

2. **Test Flow**
   - Register new user
   - Login to get tokens
   - Access protected routes with access token
   - Refresh token when expired
   - Logout to revoke tokens

## 🔧 Configuration

### Environment Variables

| Variable                 | Description          | Default       |
| ------------------------ | -------------------- | ------------- |
| `NODE_ENV`               | Environment          | `development` |
| `PORT`                   | Server port          | `8000`        |
| `DB_HOST`                | Database host        | `localhost`   |
| `DB_PORT`                | Database port        | `5432`        |
| `DB_NAME`                | Database name        | `kleverbot`   |
| `DB_USER`                | Database user        | -             |
| `DB_PASS`                | Database password    | -             |
| `JWT_ACCESS_SECRET`      | JWT access secret    | -             |
| `JWT_REFRESH_SECRET`     | JWT refresh secret   | -             |
| `JWT_ACCESS_EXPIRES_IN`  | Access token expiry  | `1h`          |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `30d`         |
| **Email Configuration**  |                      |               |
| `MAIL_HOST`              | SMTP host            | -             |
| `MAIL_PORT`              | SMTP port            | `587`         |
| `MAIL_SECURE`            | Use SSL/TLS          | `false`       |
| `MAIL_USER`              | SMTP username        | -             |
| `MAIL_PASS`              | SMTP password        | -             |
| `MAIL_FROM_NAME`         | Sender name          | `KleverBot`   |
| `MAIL_FROM_ADDRESS`      | Sender email         | -             |
| `MAIL_REPLY_TO`          | Reply-to email       | -             |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Cong Tien Dev**

- GitHub: [@congtiendev](https://github.com/congtiendev)
- Email: congtiendev@gmail.com

## 🙏 Acknowledgments

- Express.js team for the amazing framework
- Sequelize team for the powerful ORM
- All contributors who helped improve this project

---

**Happy Coding! 🚀**
