-- Seed test users for MESOB Wellness Platform
-- Run this SQL script directly in PostgreSQL

-- Customer Staff
INSERT INTO users (id, email, password, "fullName", role, phone, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'customer@mesob.et',
  '$2a$12$8qJ8.8qJ8.8qJ8.8qJ8.8uJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8',
  'Customer Staff',
  'CUSTOMER_STAFF',
  '+251911111111',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Nurse Officer
INSERT INTO users (id, email, password, "fullName", role, phone, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'nurse@mesob.et',
  '$2a$12$8qJ8.8qJ8.8qJ8.8qJ8.8uJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8',
  'Nurse Officer',
  'NURSE_OFFICER',
  '+251922222222',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Manager
INSERT INTO users (id, email, password, "fullName", role, phone, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'manager@mesob.et',
  '$2a$12$8qJ8.8qJ8.8qJ8.8qJ8.8uJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8',
  'Manager User',
  'MANAGER',
  '+251933333333',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Regional Office
INSERT INTO users (id, email, password, "fullName", role, phone, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'regional@mesob.et',
  '$2a$12$8qJ8.8qJ8.8qJ8.8qJ8.8uJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8',
  'Regional Office',
  'REGIONAL_OFFICE',
  '+251944444444',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Federal Admin
INSERT INTO users (id, email, password, "fullName", role, phone, "isActive", "isVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@mesob.et',
  '$2a$12$8qJ8.8qJ8.8qJ8.8qJ8.8uJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8qJ8.8',
  'Federal Admin',
  'FEDERAL_ADMIN',
  '+251955555555',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create health profiles for each user
INSERT INTO health_profiles (id, "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), id, NOW(), NOW()
FROM users
WHERE email IN ('customer@mesob.et', 'nurse@mesob.et', 'manager@mesob.et', 'regional@mesob.et', 'admin@mesob.et')
ON CONFLICT DO NOTHING;
