// Seed Test Users for API Testing
require('dotenv').config();

const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const testUsers = [
  {
    email: 'customer@mesob.et',
    password: 'Customer123!',
    fullName: 'Test Customer',
    role: 'CUSTOMER_STAFF',
  },
  {
    email: 'nurse@mesob.et',
    password: 'Nurse123!',
    fullName: 'Test Nurse',
    role: 'NURSE_OFFICER',
  },
  {
    email: 'manager@mesob.et',
    password: 'Manager123!',
    fullName: 'Test Manager',
    role: 'MANAGER',
  },
  {
    email: 'regional@mesob.et',
    password: 'Regional123!',
    fullName: 'Test Regional Officer',
    role: 'REGIONAL_OFFICE',
  },
  {
    email: 'admin@mesob.et',
    password: 'Admin123!',
    fullName: 'Test Federal Admin',
    role: 'FEDERAL_ADMIN',
  },
];

async function seedUsers() {
  try {
    console.log('🌱 Seeding test users...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existing) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          fullName: userData.fullName,
          role: userData.role,
          isActive: true,
          isVerified: true,
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    testUsers.forEach(user => {
      console.log(`${user.role.padEnd(20)} | ${user.email.padEnd(25)} | ${user.password}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
}

seedUsers();
