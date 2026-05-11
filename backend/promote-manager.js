require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.user.updateMany({
    where: { email: { in: ['realmanager@mesob.et', 'testmanager@mesob.et'] } },
    data: { role: 'MANAGER' }
  });
  console.log('Promoted to MANAGER:', updated.count, 'users');

  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    select: { email: true, role: true, fullName: true }
  });
  console.log('All managers:', JSON.stringify(managers, null, 2));
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
