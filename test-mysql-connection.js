import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing MySQL connection...');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Password:', process.env.DB_PASSWORD ? '***' : '(empty)');
  console.log('Database:', process.env.DB_NAME);
  console.log('');

  try {
    // Try to connect without database first
    console.log('Attempting to connect to MySQL server...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('✅ Successfully connected to MySQL server!');
    
    // Check if database exists
    const [databases] = await connection.query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === process.env.DB_NAME);
    
    if (dbExists) {
      console.log(`✅ Database '${process.env.DB_NAME}' exists`);
    } else {
      console.log(`⚠️  Database '${process.env.DB_NAME}' does not exist`);
      console.log('   Run: node create-database.js to create it');
    }

    await connection.end();
    console.log('\n✅ Connection test successful!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Check if MySQL is running');
    console.error('2. Verify your DB_PASSWORD in .env file');
    console.error('3. Make sure the MySQL user has proper permissions');
    console.error('\nCommon MySQL passwords to try:');
    console.error('- (empty password)');
    console.error('- root');
    console.error('- password');
    console.error('- admin');
    process.exit(1);
  }
}

testConnection();
