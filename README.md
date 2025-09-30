# 🤖 KleverBot Backend API

A comprehensive Node.js backend API for KleverBot application with JWT authentication, role-based
access control, and PostgreSQL database.

## 🚀 Features

- **JWT Authentication** - Access & refresh tokens
- **Role-Based Access Control** - Admin, User, Moderator roles
- **Multi-Login Support** - Login via username, email, or phone
- **Rate Limiting** - Protection against brute force attacks
- **Input Validation** - Comprehensive validation with express-validator
- **Security Headers** - Helmet.js for security best practices
- **CORS Support** - Cross-origin resource sharing
- **Winston Logging** - Structured logging system
- **PostgreSQL + Sequelize** - Database ORM with migrations
- **Docker Support** - Containerized deployment
- **ESLint + Prettier** - Code quality and formatting

## 📋 Prerequisites

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
