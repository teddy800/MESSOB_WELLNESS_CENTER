# Mesob Wellness

## Overview

Mesob Wellness is a government-grade digital wellness platform with a Node.js/Express backend, React/Vite frontend, and MySQL database.

Core modules:

- Authentication and user access control
- Health records and patient profile data
- Vitals capture and historical tracking
- Appointment lifecycle management
- Wellness plan assignment and follow-up
- Feedback and reporting

Reference API contract: docs/api.md

## Repository Structure

The repository has been normalized for team sharing with a flat, module-based layout:

```text
Mesob-Wellness/
├─ backend/
│  ├─ src/
│  ├─ prisma/
│  ├─ db/
│  ├─ package.json
│  └─ tsconfig.json
├─ frontend/
│  ├─ src/
│  ├─ public/
│  ├─ index.html
│  └─ package.json
├─ docs/
│  └─ api.md
├─ .gitignore
└─ README.md
```

## Removed from Shared Structure

The following non-essential artifacts were removed to keep the repository clean for collaboration:

- Ad-hoc authentication test shell script
- Internal seed-user TypeScript script
- Duplicate root-level Prisma scaffold and root package files
- Generated build outputs from frontend/backend

## Backend Setup

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

## Frontend Setup

1. Open a terminal in frontend
2. Install dependencies: npm install
3. Start development server: npm run dev
4. Build for production: npm run build

## Notes

- Keep environment values in local .env files only.
- Use backend/prisma as the single Prisma source.
- Use docs/api.md as the shared API reference.
