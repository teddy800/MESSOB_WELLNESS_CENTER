const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    const client = await pool.connect();
    
    console.log('🔄 Resetting admin password...');
    
    // Hash new password
    const newPassword = 'Admin123!@#';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update admin password
    const result = await client.query(
      'UPDATE users SET password = $1, "updatedAt" = NOW() WHERE email = $2 RETURNING id, email, "fullName", role',
      [hashedPassword, 'admin@mesob.et']
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      client.release();
      return;
    }
    
    const admin = result.rows[0];
    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.fullName);
    console.log('🔑 Role:', admin.role);
    console.log('');
    console.log('🚀 New credentials:');
    console.log('   Email: admin@mesob.et');
    console.log('   Password: Admin123!@#');
    console.log('');
    console.log('✅ You can now login with these credentials!');
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();