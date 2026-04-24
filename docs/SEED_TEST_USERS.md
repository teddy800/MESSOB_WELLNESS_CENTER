# Seeding Test Users

The test credentials in the documentation don't exist by default. You need to create them in the database.

## Option 1: Using SQL (Recommended - Fastest)

### Step 1: Connect to PostgreSQL
```bash
psql -U postgres -h localhost -d mesob_wellness
```

### Step 2: Run the seed script
```sql
-- Copy and paste the contents of backend/seed-users.sql
-- Or run:
\i backend/seed-users.sql
```

### Step 3: Verify users were created
```sql
SELECT email, role FROM users WHERE email LIKE '%@mesob.et';
```

## Option 2: Manual Registration

If you prefer to create users manually through the UI:

1. **Register Customer Staff**
   - Email: `customer@mesob.et`
   - Password: `Customer123!`
   - Full Name: Customer Staff

2. **Register Nurse Officer**
   - Email: `nurse@mesob.et`
   - Password: `Nurse123!`
   - Full Name: Nurse Officer

3. **Register Manager**
   - Email: `manager@mesob.et`
   - Password: `Manager123!`
   - Full Name: Manager User

4. **Register Regional Office**
   - Email: `regional@mesob.et`
   - Password: `Regional123!`
   - Full Name: Regional Office

5. **Register Federal Admin**
   - Email: `admin@mesob.et`
   - Password: `Admin123!`
   - Full Name: Federal Admin

**Note**: Public registration only creates CUSTOMER_STAFF role. For other roles, you need to:
- Use the SQL script above, OR
- Have a MANAGER or FEDERAL_ADMIN create them via the API

## Test Credentials

Once seeded, use these credentials to login:

| Role | Email | Password |
|------|-------|----------|
| Customer Staff | customer@mesob.et | Customer123! |
| Nurse Officer | nurse@mesob.et | Nurse123! |
| Manager | manager@mesob.et | Manager123! |
| Regional Office | regional@mesob.et | Regional123! |
| Federal Admin | admin@mesob.et | Admin123! |

## Troubleshooting

### "401 Unauthorized" when logging in
- Make sure the user exists in the database
- Verify the password is correct
- Check that the user's `isActive` field is `true`

### "User not found"
- The user hasn't been created yet
- Use the SQL script or manual registration to create the user

### Password doesn't work
- The passwords are hashed with bcrypt
- Use the exact passwords listed above
- If you created users manually, use the password you set during registration

## Resetting Test Users

To delete and recreate test users:

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE '%@mesob.et';

-- Then run the seed script again
\i backend/seed-users.sql
```
