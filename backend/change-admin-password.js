const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function changeAdminPassword() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    const client = await pool.connect();
    
    console.log('🔄 Changing admin password...');
    console.log('');
    
    // New password
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log('🔐 New Password: Admin123!');
    console.log('');
    
    // Update admin password
    const result = await client.query(
      'UPDATE users SET password = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING id, email, "fullName", role, "isActive", "canLogin"',
      [hashedPassword, 'admin@mesob.et']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      client.release();
      return;
    }
    
    const admin = result.rows[0];
    console.log('✅ Password changed successfully!');
    console.log('');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.fullName);
    console.log('🔑 Role:', admin.role);
    console.log('✅ Active:', admin.isActive);
    console.log('🔐 Can Login:', admin.canLogin);
    console.log('');
    console.log('🚀 New credentials:');
    console.log('   Email: admin@mesob.et');
    console.log('   Password: Admin123!');
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

changeAdminPassword();