import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function resetUsersTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    connection = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bors_db'
    });
    
    console.log('✅ Connected to MySQL\n');

    // Backup existing users
    console.log('💾 Backing up existing users...');
    try {
      await connection.query('DROP TABLE IF EXISTS users_backup');
      await connection.query('CREATE TABLE users_backup AS SELECT * FROM users');
      const [backup] = await connection.query('SELECT COUNT(*) as count FROM users_backup');
      console.log(`✅ Backed up ${backup[0].count} users\n`);
    } catch (err) {
      console.log('⚠️  No existing users to backup\n');
    }

    // Drop users table
    console.log('🗑️  Dropping users table...');
    await connection.query('DROP TABLE IF EXISTS users');
    console.log('✅ Users table dropped\n');

    // Recreate users table
    console.log('🔧 Creating new users table...');
    await connection.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone VARCHAR(50),
        profilePhoto VARCHAR(255),
        validIdFront VARCHAR(255),
        validIdBack VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created\n');

    // Restore users from backup
    try {
      console.log('📥 Restoring users from backup...');
      await connection.query(`
        INSERT INTO users (id, username, email, password, role, phone, profilePhoto, validIdFront, validIdBack, status, createdAt, updatedAt)
        SELECT id, username, email, password, role, phone, profilePhoto, validIdFront, validIdBack, status, createdAt, updatedAt
        FROM users_backup
      `);
      const [restored] = await connection.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Restored ${restored[0].count} users\n`);
      
      // Drop backup table
      await connection.query('DROP TABLE users_backup');
      console.log('✅ Backup table removed\n');
    } catch (err) {
      console.log('⚠️  No backup to restore, creating default admin...\n');
      
      // Create default admin
      const hashedPassword = await bcrypt.hash('123456', 10);
      await connection.query(`
        INSERT INTO users (username, email, password, role, status)
        VALUES ('admin', 'admin@barangay.com', ?, 'Admin', 'approved')
      `, [hashedPassword]);
      console.log('✅ Default admin created\n');
    }

    console.log('🎉 SUCCESS! Users table has been reset.');
    console.log('\n📊 Final Status:');
    const [indexes] = await connection.query('SHOW INDEX FROM users');
    console.log(`   - Total indexes: ${indexes.length}`);
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`   - Total users: ${users[0].count}`);
    
    console.log('\n✅ You can now start your application with: npm start');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nIf this fails, try:');
    console.error('1. Stop your application');
    console.error('2. Run: npm run create-db');
    console.error('3. Run: npm run setup-mysql');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetUsersTable();
