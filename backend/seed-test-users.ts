import { prisma } from './src/config/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from './src/generated/prisma';

const SALT_ROUNDS = 12;

const testUsers = [
  {
    email: 'staff@mesob.et',
    password: 'Staff123!',
    fullName: 'Staff Member',
    role: UserRole.STAFF,
    phone: '+251911111111',
  },
  {
    email: 'nurse@mesob.et',
    password: 'Nurse123!',
    fullName: 'Nurse Officer',
    role: UserRole.NURSE_OFFICER,
    phone: '+251922222222',
  },
  {
    email: 'manager@mesob.et',
    password: 'Manager123!',
    fullName: 'Manager User',
    role: UserRole.MANAGER,
    phone: '+251933333333',
  },
  {
    email: 'regional@mesob.et',
    password: 'Regional123!',
    fullName: 'Regional Office',
    role: UserRole.REGIONAL_OFFICE,
    phone: '+251944444444',
  },
  {
    email: 'federal@mesob.et',
    password: 'Federal123!',
    fullName: 'Federal Office',
    role: UserRole.FEDERAL_OFFICE,
    phone: '+251966666666',
  },
  {
    email: 'admin@mesob.et',
    password: 'Admin123!',
    fullName: 'System Admin',
    role: UserRole.SYSTEM_ADMIN,
    phone: '+251955555555',
  },
];

async function seedUsers() {
  try {
    console.log('🌱 Starting to seed test users...');

    for (const user of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

      // Create user
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          password: hashedPassword,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
          isActive: true,
          isVerified: true,
        },
      });

      // Create health profile
      await prisma.healthProfile.create({
        data: {
          userId: createdUser.id,
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('\n✨ All test users seeded successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('─'.repeat(60));
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('─'.repeat(60));
    });
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedUsers();
