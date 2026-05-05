const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    console.log('🔍 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Check if admin already exists
    const checkAdmin = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@mesob.et']
    );
    
    if (checkAdmin.rows.length > 0) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@mesob.et');
      console.log('🔑 Password: Admin123!@#');
      client.release();
      return;
    }
    
    console.log('🚀 Creating system admin user...');
    
    // Hash password
    const password = 'Admin123!@#';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create admin user
    const result = await client.query(
      `INSERT INTO users (id, email, password, "fullName", role, "isActive", "canLogin", "isExternal", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, email, "fullName", role`,
      ['admin@mesob.et', hashedPassword, 'System Administrator', 'SYSTEM_ADMIN', true, true, false]
    );
    
    const admin = result.rows[0];
    console.log('✅ System admin created successfully!');
    console.log('');
    console.log('📧 Email: admin@mesob.et');
    console.log('🔑 Password: Admin123!@#');
    console.log('👤 Name:', admin.fullName);
    console.log('🔑 Role:', admin.role);
    console.log('');
    console.log('🚨 IMPORTANT: Save these credentials securely!');
    console.log('🚨 Change the password after first login!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminUser();