const { Pool } = require('pg');

async function checkUsers() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    console.log('🔍 Checking database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ User table does not exist. Please run migrations first.');
      return;
    }
    
    console.log('✅ User table exists');
    
    // Check existing users
    const users = await client.query('SELECT id, email, "fullName", role, "isActive", "canLogin" FROM "User" ORDER BY "createdAt"');
    
    console.log(`\n📊 Found ${users.rows.length} users in database:`);
    console.log('='.repeat(80));
    
    if (users.rows.length === 0) {
      console.log('No users found in database.');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Can Login: ${user.canLogin}`);
        console.log('   ' + '-'.repeat(50));
      });
    }
    
    // Check specifically for SYSTEM_ADMIN
    const adminUsers = await client.query('SELECT * FROM "User" WHERE role = $1', ['SYSTEM_ADMIN']);
    
    console.log(`\n🔑 System Admin Users: ${adminUsers.rows.length}`);
    if (adminUsers.rows.length > 0) {
      adminUsers.rows.forEach(admin => {
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   👤 Name: ${admin.fullName}`);
        console.log(`   ✅ Active: ${admin.isActive}`);
        console.log(`   🔐 Can Login: ${admin.canLogin}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();