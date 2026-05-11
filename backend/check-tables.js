const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres123@localhost:5432/mesob_wellness?schema=public'
  });

  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📊 Tables in database:');
    if (result.rows.length === 0) {
      console.log('❌ No tables found!');
    } else {
      result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();