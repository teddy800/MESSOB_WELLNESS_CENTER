/**
 * Seed script to create test users for each role
 * Run with: npx ts-node src/scripts/seed-users.ts
 */

import { PrismaClient, UserRole, Gender } from "../generated/prisma";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Prisma adapter with connection config
const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "mesob_wellness",
});

// Initialize Prisma
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  gender?: Gender;
  phone?: string;
}

const testUsers: TestUser[] = [
  {
    email: "customer@mesob.et",
    password: "Customer123!",
    fullName: "Customer Staff User",
    role: UserRole.CUSTOMER_STAFF,
    gender: Gender.MALE,
    phone: "+251911111111",
  },
  {
    email: "nurse@mesob.et",
    password: "Nurse123!",
    fullName: "Nurse Officer User",
    role: UserRole.NURSE_OFFICER,
    gender: Gender.FEMALE,
    phone: "+251922222222",
  },
  {
    email: "manager@mesob.et",
    password: "Manager123!",
    fullName: "Manager User",
    role: UserRole.MANAGER,
    gender: Gender.MALE,
    phone: "+251933333333",
  },
  {
    email: "regional@mesob.et",
    password: "Regional123!",
    fullName: "Regional Office User",
    role: UserRole.REGIONAL_OFFICE,
    gender: Gender.FEMALE,
    phone: "+251944444444",
  },
  {
    email: "admin@mesob.et",
    password: "Admin123!",
    fullName: "Federal Admin User",
    role: UserRole.FEDERAL_ADMIN,
    gender: Gender.OTHER,
    phone: "+251955555555",
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  for (const userData of testUsers) {
    console.log(`\n📝 Creating user: ${userData.email}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`⚠️  User ${userData.email} already exists, skipping...`);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user and health profile in transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          fullName: userData.fullName,
          role: userData.role,
          gender: userData.gender,
          phone: userData.phone,
          isActive: true,
          isVerified: true,
        },
      });

      await tx.healthProfile.create({
        data: {
          userId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "SEED_USER_CREATED",
          resource: "USER",
          details: {
            role: user.role,
            method: "seed_script",
          },
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    });
  }

  console.log("\n✨ Seed completed successfully!");
  console.log("\n📋 Test Users:");
  console.log("━".repeat(60));
  testUsers.forEach((user) => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Role: ${user.role}`);
    console.log("━".repeat(60));
  });
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
