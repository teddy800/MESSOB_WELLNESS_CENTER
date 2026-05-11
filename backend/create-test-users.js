const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Creating test users...");

  // Create a region
  const region = await prisma.region.upsert({
    where: { name: "Addis Ababa" },
    update: {},
    create: { name: "Addis Ababa", code: "AA" },
  });

  // Create a center
  const center = await prisma.center.upsert({
    where: { name: "Bole Center" },
    update: {},
    create: {
      name: "Bole Center",
      region: "Addis Ababa",
      city: "Addis Ababa",
      address: "Bole, Addis Ababa",
      phone: "+251911234567",
      email: "bole@mesob.et",
      status: "ACTIVE",
    },
  });

  const testUsers = [
    { email: "admin@mesob.et", password: "Admin123!", fullName: "System Admin", role: "SYSTEM_ADMIN" },
    { email: "staff@mesob.et", password: "Staff123!", fullName: "Staff Member", role: "STAFF" },
    { email: "nurse@mesob.et", password: "Nurse123!", fullName: "Nurse Officer", role: "NURSE_OFFICER" },
    { email: "manager@mesob.et", password: "Manager123!", fullName: "Center Manager", role: "MANAGER" },
    { email: "regional@mesob.et", password: "Regional123!", fullName: "Regional Officer", role: "REGIONAL_OFFICE" },
    { email: "federal@mesob.et", password: "Federal123!", fullName: "Federal Officer", role: "FEDERAL_OFFICE" },
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
