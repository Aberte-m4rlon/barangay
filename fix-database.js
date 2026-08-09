import 'dotenv/config';
import mysql2 from 'mysql2/promise';

async function fixDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bors_db'
    });
    
    console.log('✅ Connected to MySQL');

    // Get all indexes on users table
    console.log('\n🔍 Checking indexes on users table...');
    const [indexes] = await connection.query('SHOW INDEX FROM users');
    
    console.log(`Found ${indexes.length} indexes`);
    
    // Drop duplicate indexes (keep PRIMARY and first occurrence of each unique constraint)
    const indexesToKeep = new Set(['PRIMARY', 'username', 'email']);
    const indexesToDrop = [];
    
    const seenIndexes = new Set();
    for (const index of indexes) {
      if (index.Key_name === 'PRIMARY') continue;
      
      if (seenIndexes.has(index.Key_name)) {
        indexesToDrop.push(index.Key_name);
      } else {
        seenIndexes.add(index.Key_name);
      }
    }
    
    // Drop duplicate indexes
    for (const indexName of new Set(indexesToDrop)) {
      try {
        console.log(`🗑️  Dropping duplicate index: ${indexName}`);
        await connection.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (err) {
        console.log(`⚠️  Could not drop ${indexName}: ${err.message}`);
      }
    }
    
    // Ensure we have the correct unique indexes
    console.log('\n🔧 Ensuring correct indexes...');
    
    // Check if username index exists
    const [usernameIndex] = await connection.query(
      "SELECT * FROM information_schema.statistics WHERE table_schema = ? AND table_name = 'users' AND column_name = 'username' AND non_unique = 0",
      [process.env.DB_NAME || 'bors_db']
    );
    
    if (usernameIndex.length === 0) {
      console.log('➕ Adding unique index on username...');
      await connection.query('ALTER TABLE users ADD UNIQUE INDEX username (username)');
      console.log('✅ Added username index');
    } else {
      console.log('✅ Username index exists');
    }
    
    // Check if email index exists
    const [emailIndex] = await connection.query(
      "SELECT * FROM information_schema.statistics WHERE table_schema = ? AND table_name = 'users' AND column_name = 'email' AND non_unique = 0",
      [process.env.DB_NAME || 'bors_db']
    );
    
    if (emailIndex.length === 0) {
      console.log('➕ Adding unique index on email...');
      await connection.query('ALTER TABLE users ADD UNIQUE INDEX email (email)');
      console.log('✅ Added email index');
    } else {
      console.log('✅ Email index exists');
    }
    
    console.log('\n✅ Database fixed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Dropped ${indexesToDrop.length} duplicate indexes`);
    console.log('   - Ensured username and email unique indexes exist');
    console.log('\n🚀 You can now restart your application');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixDatabase();
