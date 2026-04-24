const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'mesob_wellness',
});

const SALT_ROUNDS = 12;

const testUsers = [
  {
    email: 'customer@mesob.et',
    password: 'Customer123!',
    fullName: 'Customer Staff',
    role: 'CUSTOMER_STAFF',
    phone: '+251911111111',
  },
  {
    email: 'nurse@mesob.et',
    password: 'Nurse123!',
    fullName: 'Nurse Officer',
    role: 'NURSE_OFFICER',
    phone: '+251922222222',
  },
  {
    email: 'manager@mesob.et',
    password: 'Manager123!',
    fullName: 'Manager User',
    role: 'MANAGER',
    phone: '+251933333333',
  },
  {
    email: 'regional@mesob.et',
    password: 'Regional123!',
    fullName: 'Regional Office',
    role: 'REGIONAL_OFFICE',
    phone: '+251944444444',
  },
  {
    email: 'admin@mesob.et',
    password: 'Admin123!',
    fullName: 'Federal Admin',
    role: 'FEDERAL_ADMIN',
    phone: '+251955555555',
  },
];

async function createUsers() {
  try {
    console.log('🌱 Creating test users...\n');

    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      const userId = require('crypto').randomUUID();

      const query = `
        INSERT INTO users (id, email, password, "fullName", role, phone, "isActive", "isVerified", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, true, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET password = $3
      `;

      await pool.query(query, [userId, user.email, hashedPassword, user.fullName, user.role, user.phone]);

      // Create health profile
      const healthQuery = `
        INSERT INTO health_profiles (id, "userId", "createdAt", "updatedAt")
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `;

      const healthId = require('crypto').randomUUID();
      await pool.query(healthQuery, [healthId, userId]);

      console.log(`✅ Created: ${user.email} (${user.role})`);
    }

    console.log('\n✨ All test users created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('─'.repeat(60));
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('─'.repeat(60));
    });
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createUsers();
