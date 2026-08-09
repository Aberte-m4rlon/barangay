import 'dotenv/config';
import mysql2 from 'mysql2/promise';

async function createDatabase() {
  let connection;
  
  try {
    // Connect to MySQL without specifying a database
    console.log('🔄 Connecting to MySQL server...');
    connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'bors_db';
    console.log(`🔄 Creating database '${dbName}'...`);
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`✅ Database '${dbName}' created successfully`);
    console.log('\n✅ You can now run: npm run setup-mysql');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDatabase();
