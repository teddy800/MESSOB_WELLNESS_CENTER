// Test PostgreSQL Connection
// Run with: node test-postgres-connection.js

require('dotenv').config();

const { PrismaClient } = require('./src/generated/prisma');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing PostgreSQL connection...');
    console.log('📍 Connection URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result[0].version);
    
    await prisma.$disconnect();
    await pool.end();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Check if PostgreSQL is running (Windows Services)');
    console.error('2. Verify the password in backend/.env file');
    console.error('3. Ensure the database "mesob_wellness" exists');
    console.error('4. Check if port 5432 is correct');
    console.error('5. URL-encode special characters in password (@ = %40, # = %23)');
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  }
}

testConnection();
