import { prisma } from "./src/config/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Creating test users...");

  // Create a center
  const center = await prisma.center.upsert({
    where: { code: "BOLE001" },
    update: {},
    create: {
      name: "Bole Center",
      code: "BOLE001",
      region: "Addis Ababa",
      city: "Addis Ababa",
      address: "Bole, Addis Ababa",
      phone: "+251911234567",
      email: "bole@mesob.et",
      status: "ACTIVE",
    },
  });

  const testUsers = [
    { email: "admin@mesob.et", password: "Admin123!", fullName: "System Admin", role: "SYSTEM_ADMIN" as const },
    { email: "staff@mesob.et", password: "Staff123!", fullName: "Staff Member", role: "STAFF" as const },
    { email: "nurse@mesob.et", password: "Nurse123!", fullName: "Nurse Officer", role: "NURSE_OFFICER" as const },
    { email: "manager@mesob.et", password: "Manager123!", fullName: "Center Manager", role: "MANAGER" as const },
    { email: "regional@mesob.et", password: "Regional123!", fullName: "Regional Officer", role: "REGIONAL_OFFICE" as const },
    { email: "federal@mesob.et", password: "Federal123!", fullName: "Federal Officer", role: "FEDERAL_OFFICE" as const },
  ];

  for (const userData of testUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        role: userData.role,
        centerId: center.id,
        isActive: true,
        isVerified: true,
        canLogin: true,
      },
    });
    console.log(`✅ Created: ${user.email} (${user.role})`);
  }

  console.log("✨ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
