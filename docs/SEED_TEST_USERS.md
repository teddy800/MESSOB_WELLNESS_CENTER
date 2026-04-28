# Seeding Test Users

This document provides instructions for seeding test users into the Mesob Wellness database with the new 7-tier role system.

## Quick Start (Recommended)

```bash
cd backend
npx ts-node seed-test-users.ts
```

This will create 5 test users with different roles for testing all features.

## Test User Credentials

### 1. Staff Member (STAFF)
- **Email**: `staff@mesob.et`
- **Password**: `Staff123!`
- **Role**: STAFF
- **Access**: Customer dashboard, appointments, wellness plans, health records

### 2. Nurse Officer (NURSE_OFFICER)
- **Email**: `nurse@mesob.et`
- **Password**: `Nurse123!`
- **Role**: NURSE_OFFICER
- **Access**: Nurse dashboard, patient registration, vitals entry, wellness plan creation, queue management

### 3. Manager (MANAGER)
- **Email**: `manager@mesob.et`
- **Password**: `Manager123!`
- **Role**: MANAGER
- **Access**: Manager dashboard, analytics, staff management, center operations, capacity tracking

### 4. Regional Office (REGIONAL_OFFICE)
- **Email**: `regional@mesob.et`
- **Password**: `Regional123!`
- **Role**: REGIONAL_OFFICE
- **Access**: Regional dashboard, multi-center analytics, regional reports, center management

### 5. Federal Office (FEDERAL_OFFICE)
- **Email**: `federal@mesob.et`
- **Password**: `Federal123!`
- **Role**: FEDERAL_OFFICE
- **Access**: Federal dashboard, national analytics, federal reports, policy management

### 6. System Admin (SYSTEM_ADMIN)
- **Email**: `admin@mesob.et`
- **Password**: `Admin123!`
- **Role**: SYSTEM_ADMIN
- **Access**: Full system access, user management, system settings, all analytics, center creation

## Role Hierarchy

The system uses a 7-tier role hierarchy (0-6):

0. **EXTERNAL_PATIENT** - Walk-in patients (cannot login)
1. **STAFF** - Mesob employees seeking healthcare
2. **NURSE_OFFICER** - Healthcare providers
3. **MANAGER** - Center managers
4. **REGIONAL_OFFICE** - Regional administrators
5. **FEDERAL_OFFICE** - Federal-level administrators
6. **SYSTEM_ADMIN** - Highest privilege (system administrators)

## Alternative Methods

### Option 1: Using SQL Script

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -d mesob_wellness

# Run the seed script
\i backend/seed-users.sql
```

### Option 2: Manual Registration

Public registration only creates STAFF role. For other roles, you need to:
- Use the TypeScript seed script (recommended)
- Use the SQL script
- Have a SYSTEM_ADMIN create them via the API

## Verifying Users

Check that users were created:

```sql
SELECT email, role, "isActive", "canLogin" FROM users WHERE email LIKE '%@mesob.et';
```

Expected output:
```
email              | role            | isActive | canLogin
-------------------+-----------------+----------+----------
staff@mesob.et     | STAFF           | t        | t
nurse@mesob.et     | NURSE_OFFICER   | t        | t
manager@mesob.et   | MANAGER         | t        | t
regional@mesob.et  | REGIONAL_OFFICE | t        | t
admin@mesob.et     | SYSTEM_ADMIN    | t        | t
```

## Troubleshooting

### "401 Unauthorized" when logging in
- Make sure the user exists in the database
- Verify the password is correct (case-sensitive)
- Check that the user's `isActive` field is `true`
- Check that the user's `canLogin` field is `true`

### "User not found"
- The user hasn't been created yet
- Run the seed script: `npx ts-node seed-test-users.ts`

### "This account cannot login"
- The user has `canLogin` set to `false`
- This is expected for EXTERNAL_PATIENT role
- For other roles, update the database: `UPDATE users SET "canLogin" = true WHERE email = 'user@mesob.et';`

### Password doesn't work
- Passwords are case-sensitive
- Use the exact passwords listed above
- If you created users manually, use the password you set during registration

## Resetting Test Users

To delete and recreate test users:

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE '%@mesob.et';

-- Then run the seed script again
```

```bash
cd backend
npx ts-node seed-test-users.ts
```

## Creating External Patients

External patients (walk-ins) cannot be created through normal registration. They must be created by a NURSE_OFFICER through the nurse dashboard:

1. Login as nurse@mesob.et
2. Go to Nurse Dashboard
3. Click "Register Walk-In Patient"
4. Fill in patient details
5. Patient will be created with:
   - `role`: EXTERNAL_PATIENT
   - `isExternal`: true
   - `canLogin`: false
   - `email`: null (optional)
   - `password`: null

## Notes

- All test users are created with `isActive: true` and `isVerified: true`
- Passwords are hashed with bcrypt (12 rounds)
- Each user automatically gets a health profile created
- Test users can be safely deleted and recreated at any time
- The seed script is idempotent (won't create duplicates)

