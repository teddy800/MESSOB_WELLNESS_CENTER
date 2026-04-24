# Mesob Wellness Platform

A comprehensive government-grade digital wellness platform for managing health screenings, vitals tracking, appointments, wellness plans, and center analytics across Ethiopia.

## 🎯 Overview

Mesob Wellness provides a complete healthcare management system with:

- **Authentication & Authorization** - Role-based access control (5 levels)
- **User Management** - Profile management and health records
- **Vitals Tracking** - BMI, blood pressure, and health metrics with history
- **Appointments** - Complete lifecycle management with status tracking
- **Wellness Plans** - Personalized health plans and goal tracking
- **Feedback System** - Patient feedback and satisfaction ratings
- **Centers Management** - Multi-center operations and analytics
- **Analytics Dashboard** - Center, regional, and national-level insights

## 📁 Repository Structure

```
Mesob-Wellness/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth & validation
│   │   └── config/       # Configuration
│   ├── prisma/           # Database schema & migrations
│   └── test-all-endpoints.sh  # Comprehensive API tests
├── frontend/             # React/Vite UI
│   └── src/
├── docs/                 # Documentation
│   ├── api.md           # API contract
│   ├── BACKEND_API.md   # Complete API docs
│   ├── DATABASE_SCHEMA.md  # Database documentation
│   └── IMPLEMENTATION_STATUS.md  # Feature status
└── README.md            # This file
```

## 🗄️ Database

**PostgreSQL 15+** - Production-grade relational database

### Why PostgreSQL?
- ✅ Native UUID support
- ✅ JSONB for flexible data storage
- ✅ Timezone-aware timestamps
- ✅ Advanced indexing capabilities
- ✅ Full-text search support
- ✅ Better performance and scalability
- ✅ ACID compliance
- ✅ Active community support

### Setup PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Create Database
```bash
sudo -u postgres psql
CREATE DATABASE mesob_wellness;
\q
```

---

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
# Update .env with PostgreSQL connection string
npm run prisma:generate
npm run prisma:migrate:dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
cd backend
bash test-all-endpoints.sh
```

## 🔐 Test Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Customer Staff | customer@mesob.et | Customer123! | Basic access |
| Nurse Officer | nurse@mesob.et | Nurse123! | Record vitals, manage appointments |
| Manager | manager@mesob.et | Manager123! | Center management, view analytics |
| Regional Office | regional@mesob.et | Regional123! | Regional analytics |
| Federal Admin | admin@mesob.et | Admin123! | Full system access, manage centers |

**⚠️ Important**: These users must be seeded first. See [SEED_TEST_USERS.md](docs/SEED_TEST_USERS.md) for instructions.

## 📡 API Endpoints (31 Total)

### Authentication (6)
- `POST /api/v1/auth/register` - Public registration (CUSTOMER_STAFF only)
- `POST /api/v1/auth/create-user` - Hierarchical user creation (requires auth)
- `POST /api/v1/auth/login` - Login and get JWT token
- `POST /api/v1/auth/verify-token` - Verify token validity
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout user

### Users (2)
- `GET /api/v1/users/me` - Get user profile
- `PUT /api/v1/users/me` - Update user profile

### Vitals (5)
- `GET /api/v1/vitals/status` - Check vitals module status
- `POST /api/v1/vitals/bmi` - Record BMI
- `POST /api/v1/vitals/blood-pressure` - Record blood pressure
- `GET /api/v1/vitals/history/:userId` - Get vitals history
- `GET /api/v1/vitals/latest/:userId` - Get latest vitals

### Appointments (4)
- `GET /api/v1/appointments` - List appointments
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments/:id` - Get appointment details
- `PATCH /api/v1/appointments/:id` - Update appointment status

### Wellness Plans (2)
- `POST /api/v1/plans` - Create wellness plan
- `GET /api/v1/plans/:userId` - Get user's wellness plans

### Feedback (2)
- `POST /api/v1/feedback` - Submit feedback
- `GET /api/v1/feedback` - Get all feedback (with stats)

### Centers Management (8)
- `POST /api/v1/centers` - Create center (FEDERAL_ADMIN only)
- `GET /api/v1/centers` - List all centers
- `GET /api/v1/centers/:id` - Get center details
- `PUT /api/v1/centers/:id` - Update center (FEDERAL_ADMIN only)
- `DELETE /api/v1/centers/:id` - Delete center (FEDERAL_ADMIN only)
- `GET /api/v1/centers/:id/analytics` - Get center analytics
- `GET /api/v1/centers/analytics/region/:region` - Get regional analytics
- `GET /api/v1/centers/analytics/all` - Get all centers analytics (FEDERAL_ADMIN only)

### Health Checks (2)
- `GET /health` - API health check
- `GET /api/health` - Detailed health status

## 🏥 Centers Management

### Features
- **FEDERAL_ADMIN** can create, update, and delete centers
- **Center Managers** can view their center's analytics
- **Regional Officers** can view all centers in their region
- **FEDERAL_ADMIN** can view nationwide analytics

### Center Analytics Include:
- Total staff assigned
- Total appointments (completed, pending)
- Total vitals recorded
- Average feedback rating

### Regional Analytics Include:
- Number of centers in region
- Aggregated statistics across all centers
- Per-center breakdown

### National Analytics Include:
- Total centers and regions
- Nationwide statistics
- Regional breakdowns

## � Hierarchical Role Creation

### Registration Rules

**Public Registration:**
- Anyone can register via `POST /api/v1/auth/register`
- Always creates **CUSTOMER_STAFF** role
- Cannot specify role in registration

**Hierarchical User Creation:**
- Use `POST /api/v1/auth/create-user` (requires authentication)
- **FEDERAL_ADMIN** can create any role
- **MANAGER** can create NURSE_OFFICER and CUSTOMER_STAFF (must assign to center)
- Other roles cannot create users

### Creation Matrix

| Creator Role | Can Create |
|--------------|------------|
| FEDERAL_ADMIN | All roles |
| MANAGER | NURSE_OFFICER, CUSTOMER_STAFF |
| Others | ❌ Cannot create users |

---

## �🔒 Role-Based Access Control

| Feature | Customer | Nurse | Manager | Regional | Federal Admin |
|---------|----------|-------|---------|----------|---------------|
| View own profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| Record vitals | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create appointments | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update appointments | ❌ | ✅ | ✅ | ✅ | ✅ |
| Create wellness plans | ❌ | ✅ | ✅ | ✅ | ✅ |
| Submit feedback | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all feedback | ❌ | ❌ | ✅ | ✅ | ✅ |
| View center analytics | ❌ | Own center | Own center | Region | All |
| Manage centers | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🗄️ Database Schema

### Tables
- **users** - User accounts and authentication
- **health_profiles** - User health information
- **vital_records** - BMI, blood pressure, and vitals history
- **appointments** - Appointment management
- **wellness_plans** - Personalized wellness plans
- **feedback** - User feedback and ratings
- **centers** - Health centers/facilities
- **audit_logs** - Compliance and security logging

## 🧪 Testing

### Prerequisites
Before running tests, seed the test users:

```bash
cd backend
node seed-test-users.js
```

### Run Comprehensive Test Suite

**All Platforms (Linux, macOS, Windows):**
```bash
cd docs
bash test-all-endpoints.sh
```

**Windows Users:**
- **Recommended:** Use Git Bash (included with Git for Windows)
- **Alternative:** Use WSL (Windows Subsystem for Linux)

### Test Utilities

**Test Database Connection:**
```bash
cd backend
node test-postgres-connection.js
```

**Seed Test Users:**
```bash
cd backend
node seed-test-users.js
```

### Test Coverage
- ✅ 30+ test cases
- ✅ All 31 endpoints tested
- ✅ Authentication & authorization
- ✅ Role-based access control (RBAC)
- ✅ Error handling & edge cases
- ✅ Multi-role testing (5 roles)

## 📊 Build Status

```
✅ TypeScript: Clean (0 errors)
✅ Database: Migrated
✅ Tests: Passing
✅ Documentation: Complete
✅ Centers Management: Implemented
✅ Analytics: Implemented
```

## 🔐 Security & Compliance

- **JWT Authentication** - 1-hour token expiration
- **Password Hashing** - bcrypt with 12 rounds
- **Audit Logging** - All actions logged for compliance
- **Data Sovereignty** - Local-only data storage
- **Proclamation 1321/2024** - Fully compliant

## 📚 Documentation

- **[Complete API Guide](docs/API_COMPLETE_GUIDE.md)** - Comprehensive API documentation with frontend requirements
- **[PostgreSQL Migration](docs/POSTGRESQL_MIGRATION.md)** - Complete migration guide from MySQL to PostgreSQL
- **[API Contract](docs/api.md)** - Original API specification

---

## 🌟 Key Features

**Backend:**
- Node.js + Express
- TypeScript
- Prisma ORM
- **PostgreSQL Database** (migrated from MySQL)
- JWT Authentication
- bcrypt Password Hashing

**Frontend:**
- React
- Vite
- React Router

---

## 📝 Development Workflow

1. **Start Backend:** `cd backend && npm run dev`
2. **Start Frontend:** `cd frontend && npm run dev`
3. **Seed Test Users:** `cd backend && node seed-test-users.js`
4. **Run Tests:** `cd docs && bash test-all-endpoints.sh`
5. **View Database:** `cd backend && npx prisma studio`
6. **Create Migration:** `cd backend && npx prisma migrate dev --name description`

---

## 🔄 PostgreSQL Migration

The project has been migrated from MySQL to PostgreSQL for better performance and features.

**Key Changes:**
- UUID primary keys instead of auto-increment
- Timezone-aware timestamps
- JSONB for better JSON performance
- Advanced indexing capabilities

**Migration Guide:** See `docs/POSTGRESQL_MIGRATION.md` for complete details.

**Quick Migration:**
```bash
cd backend
# Install PostgreSQL and create database
createdb mesob_wellness
# Update .env with PostgreSQL connection
npm install
npx prisma generate
npx prisma migrate dev --name init_postgresql
npm run dev
```

---

## 📚 Documentation

### Vitals Management
- BMI calculation and categorization
- Blood pressure classification
- Historical tracking
- Latest vitals retrieval

### Appointment System
- 6 status types (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED)
- Diagnosis and prescription recording
- Status filtering
- Timestamp tracking

### Wellness Plans
- Personalized health plans
- Goal tracking
- Duration management
- Active/inactive status

### Feedback System
- 1-5 star ratings
- Comments and categories
- Statistics and analytics
- Manager-level access

### Centers Management
- Multi-center operations
- Regional organization
- Staff assignment
- Comprehensive analytics

## 📈 Analytics Features

### Center Level
- Staff count
- Appointment statistics
- Vitals recorded
- Average feedback rating

### Regional Level
- Centers in region
- Aggregated statistics
- Per-center breakdown

### National Level
- Total centers and regions
- Nationwide metrics
- Regional comparisons

## 🚦 API Response Format

**Success:**
```json
{
  "status": "success",
  "data": { ... }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Error description"
}
```

## 🔧 Environment Variables

**Backend (.env):**
```env
NODE_ENV=development
PORT=5000

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your_password
DB_NAME=mesob_wellness

# PostgreSQL Connection String
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/mesob_wellness?schema=public

# JWT Configuration
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
```

---

## 📝 Development Workflow

1. **Start Backend:** `cd backend && npm run dev`
2. **Start Frontend:** `cd frontend && npm run dev`
3. **Run Tests:** `cd backend && bash test-all-endpoints.sh`
4. **View Database:** `cd backend && npx prisma studio`
5. **Create Migration:** `cd backend && npx prisma migrate dev --name description`

## 🎯 Next Steps

- [ ] Frontend implementation for centers management
- [ ] Analytics dashboard UI
- [ ] Real-time notifications
- [ ] Report generation
- [ ] Data export functionality
- [ ] Mobile app development

1. Open a terminal in backend
2. Install dependencies: npm install
3. Create backend/.env from backend/.env.example and update DB credentials for your local MySQL
4. Start development server: npm run dev
5. Build for production: npm run build

## Role-Based Testing Credentials (Local)

Use the following credential set for controlled local API testing.

| Role            | Email                       | Password    |
| --------------- | --------------------------- | ----------- |
| CUSTOMER_STAFF  | customer.staff@mesob.local  | Mesob@2026! |
| NURSE_OFFICER   | nurse.officer@mesob.local   | Mesob@2026! |
| MANAGER         | manager@mesob.local         | Mesob@2026! |
| REGIONAL_OFFICE | regional.office@mesob.local | Mesob@2026! |
| FEDERAL_ADMIN   | federal.admin@mesob.local   | Mesob@2026! |

If these users do not exist yet, create them using POST /api/v1/auth/register with the matching email and role.

## Manual API Verification (Role and Access)

1. Start backend API from backend: npm run dev
2. Confirm service readiness:
   - GET /health
   - GET /api/health
3. Register the 5 role accounts if this is a new database:
   - Endpoint: POST /api/v1/auth/register
   - Minimum body fields: fullName, email, password, role
4. Login each role and capture JWT token:
   - Endpoint: POST /api/v1/auth/login
5. Validate token and authenticated identity for each account:
   - POST /api/v1/auth/verify-token
   - GET /api/v1/auth/me (Authorization: Bearer <token>)
6. Verify role enforcement on Vitals module:
   - POST /api/v1/vitals/bmi with CUSTOMER_STAFF token should return 403
   - POST /api/v1/vitals/bmi with NURSE_OFFICER, MANAGER, REGIONAL_OFFICE, and FEDERAL_ADMIN tokens should return 200
   - Example body: { "weightKg": 72, "heightCm": 175 }
7. Verify appointment routes are accessible for authenticated roles:
   - GET /api/v1/appointments should return 200 for all five roles
   - POST /api/v1/appointments should return 201 for all five roles
   - Example body: { "patientId": 1001, "scheduledAt": "2026-04-25T10:00:00.000Z", "reason": "Routine follow-up" }
8. Run security negative tests:
   - Missing token on protected route should return 401
   - Invalid token should return 401
   - Expired token should return 401

## API Implementation Status

Implemented now (available in backend):

- GET /health
- GET /api/health
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/verify-token
- GET /api/v1/auth/me
- POST /api/v1/auth/logout

On the way
- GET /api/v1/vitals/status
- POST /api/v1/vitals/bmi
- POST /api/v1/vitals/blood-pressure
- GET /api/v1/appointments
- POST /api/v1/appointments

To be built (planned endpoints from API contract):

- GET /api/users/me
- PUT /api/users/me
- POST /api/vitals
- GET /api/vitals/:userId
- PUT /api/appointments/:id
- POST /api/plans
- GET /api/plans/:userId
- POST /api/feedback

For issues or questions, refer to the documentation in the `docs/` folder.

## 📄 License

Government of Ethiopia - Ministry of Health

- Keep environment values in local .env files only.
- Use backend/prisma as the single Prisma source.
- Use docs/api.md as the shared API reference.
