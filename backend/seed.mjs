import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Load .env manually before importing Prisma
const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '.env'), 'utf8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  process.env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
}

const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
const pg = require('pg');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log('🌱 Seeding test users...');
  console.log('   Connecting to:', process.env.DATABASE_URL);

  const password = await hash('password123');

  const users = [
    { email: 'admin@mesob.et',    fullName: 'System Admin',     role: 'SYSTEM_ADMIN'    },
    { email: 'federal@mesob.et',  fullName: 'Federal Officer',  role: 'FEDERAL_OFFICE'  },
    { email: 'regional@mesob.et', fullName: 'Regional Officer', role: 'REGIONAL_OFFICE' },
    { email: 'manager@mesob.et',  fullName: 'Center Manager',   role: 'MANAGER'         },
    { email: 'nurse@mesob.et',    fullName: 'Nurse Officer',    role: 'NURSE_OFFICER'   },
    { email: 'staff@mesob.et',    fullName: 'Staff Member',     role: 'STAFF'           },
  ];

  for (const u of users) {
    await pool.query(`
      INSERT INTO users (id, email, password, "fullName", role, "isActive", "isVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4::\"UserRole\", true, true, NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [u.email, password, u.fullName, u.role]);
    console.log(`  ✅ ${u.role.padEnd(16)} → ${u.email}`);
  }

  console.log('\n✅ Done! All users use password: password123');
  await pool.end();
}

main().catch((e) => { console.error('❌ Error:', e.message); process.exit(1); });
