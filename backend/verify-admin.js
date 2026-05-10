const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function verifyAdmin() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    const client = await pool.connect();
    
    // Get admin user
    const result = await client.query(
      'SELECT id, email, password, "fullName", role, "isActive", "canLogin" FROM users WHERE email = $1',
      ['admin@mesob.et']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      client.release();
      return;
    }
    
    const admin = result.rows[0];
    console.log('✅ Admin user found!');
    console.log('');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.fullName);
    console.log('🔑 Role:', admin.role);
    console.log('✅ Active:', admin.isActive);
    console.log('🔐 Can Login:', admin.canLogin);
    console.log('');
    
    // Test password
    const testPassword = 'Admin123!@#';
    const isPasswordValid = await bcrypt.compare(testPassword, admin.password);
    
    console.log('🔐 Password Verification:');
    console.log('   Test Password: Admin123!@#');
    console.log('   Password Valid:', isPasswordValid ? '✅ YES' : '❌ NO');
    console.log('');
    
    if (isPasswordValid) {
      console.log('✅ Credentials are correct!');
      console.log('');
      console.log('🚀 You can now login with:');
      console.log('   Email: admin@mesob.et');
      console.log('   Password: Admin123!@#');
    } else {
      console.log('❌ Password does not match!');
      console.log('   The password hash in database does not match the expected password.');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyAdmin();