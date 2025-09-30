# KleverBot Backend - Updated Structure

## 🎯 **Changes Made**

### **Problem Solved:**

- ❌ **Duplicate folder structure** (root level vs src/)
- ❌ **Conflicting database systems** (Custom vs Sequelize CLI)
- ❌ **Module aliases conflicts**

### **Solution Applied:**

- ✅ **Consolidated everything into `src/`**
- ✅ **Using Sequelize CLI standard**
- ✅ **Clean module aliases**

## 📁 **New Structure**

```
kleverbot-backend/
├── src/                           # Main source directory
│   ├── app.js                     # Express app configuration
│   ├── config/
│   │   ├── index.js              # Main config
│   │   ├── environment.js         # Environment config
│   │   ├── database.js           # Custom DB config
│   │   └── sequelize.js          # Sequelize CLI config
│   ├── controllers/              # API controllers (empty - ready to implement)
│   ├── middleware/               # Custom middleware
│   ├── services/                 # Business logic (empty - ready to implement)
│   ├── repositories/             # Data access layer (empty)
│   ├── routes/                   # API routes (empty - ready to implement)
│   ├── utils/                    # Utilities
│   ├── validators/               # Validation schemas (empty)
│   └── database/
│       ├── sequelize-models/     # Sequelize models
│       ├── sequelize-migrations/ # Sequelize migrations
│       ├── sequelize-seeders/    # Sequelize seeders
│       ├── custom-migrations-backup/  # Backup of custom system
│       └── custom-seeders-backup/     # Backup of custom system
├── scripts/                      # Utility scripts
├── logs/                         # Log files
├── uploads/                      # File uploads
├── tests/                        # Test files
├── .sequelizerc                  # Sequelize CLI config
└── server.js                     # Entry point
```

## 🗄️ **Database Commands**

### **New Sequelize CLI Commands:**

```bash
# Create database
npm run db:create

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Seed database
npm run db:seed:all

# Generate new model
npm run model:generate -- --name User --attributes firstName:string,lastName:string

# Generate new migration
npm run migration:generate -- --name add-email-to-users

# Generate new seeder
npm run seed:generate -- --name demo-users
```

## 🔧 **Module Aliases**

Updated aliases pointing to `src/`:

```javascript
"@": "./src",
"@/config": "./src/config",
"@/controllers": "./src/controllers",
"@/models": "./src/database/sequelize-models",
"@/database": "./src/database"
// ... etc
```

## 📋 **Next Steps**

1. **Create API Controllers** in `src/controllers/`
2. **Create API Routes** in `src/routes/`
3. **Create Services** in `src/services/`
4. **Create Validators** in `src/validators/`
5. **Test database connection:** `npm run db:migrate`

## 🚨 **Important Notes**

- **Custom migration/seeder files** have been **backed up** with `-backup` suffix
- **Routes are commented out** in `app.js` until you create them
- **Database schema** remains the same, just using Sequelize CLI now
- **All dependencies** are preserved

## 🔄 **Migration from Custom to Sequelize**

If you want to recreate your custom migrations as Sequelize migrations:

1. Look at backup files in `src/database/custom-migrations-backup/`
2. Create equivalent Sequelize migrations using `npm run migration:generate`
3. Convert custom SQL to Sequelize migration format

The old custom system has been safely backed up and can be restored if needed.
