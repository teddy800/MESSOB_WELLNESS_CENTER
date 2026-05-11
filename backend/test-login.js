const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    const client = await pool.connect();
    
    console.log('🔍 Testing login flow...');
    console.log('');
    
    // Test 1: Check all users
    const allUsers = await client.query('SELECT id, email, "fullName", role, "isActive", "canLogin" FROM users');
    console.log('📊 All users in database:');
    allUsers.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.fullName}) - Role: ${user.role}`);
    });
    console.log('');
    
    // Test 2: Find admin by exact email
    const adminExact = await client.query(
      'SELECT id, email, password, "fullName", role, "isActive", "canLogin" FROM users WHERE email = $1',
      ['admin@mesob.et']
    );
    
    if (adminExact.rows.length === 0) {
      console.log('❌ Admin not found with exact email: admin@mesob.et');
      client.release();
      return;
    }
    
    const admin = adminExact.rows[0];
    console.log('✅ Admin found!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.fullName);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive);
    console.log('   Can Login:', admin.canLogin);
    console.log('');
    
    // Test 3: Simulate login
    console.log('🔐 Testing password verification...');
    const testPassword = 'Admin123!@#';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    console.log('   Password:', testPassword);
    console.log('   Valid:', isValid ? '✅ YES' : '❌ NO');
    console.log('');
    
    // Test 4: Check if user can login
    if (!admin.isActive) {
      console.log('❌ User is not active!');
    } else if (!admin.canLogin) {
      console.log('❌ User cannot login!');
    } else if (!isValid) {
      console.log('❌ Password is incorrect!');
    } else {
      console.log('✅ Login should work!');
      console.log('');
      console.log('🚀 Try logging in with:');
      console.log('   Email: admin@mesob.et');
      console.log('   Password: Admin123!@#');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();