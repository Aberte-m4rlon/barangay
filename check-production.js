// Production Environment Checker
// Run this on the server to verify configuration

import 'dotenv/config';
import { sequelize } from './config/db.js';

console.log('\n========================================');
console.log('🔍 Production Environment Check');
console.log('========================================\n');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

// Check 1: Environment Variables
console.log('1️⃣  Checking Environment Variables...');
const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'SESSION_SECRET',
  'PORT'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: Set`);
    checks.passed++;
  } else {
    console.log(`   ❌ ${varName}: Missing`);
    checks.failed++;
  }
});

// Check 2: Session Secret
console.log('\n2️⃣  Checking Session Secret...');
if (process.env.SESSION_SECRET === 'your-secret-key-here' || 
    process.env.SESSION_SECRET === 'xianfire-secret-key') {
  console.log('   ⚠️  WARNING: Using default session secret!');
  console.log('   Please change SESSION_SECRET to a random string');
  checks.warnings++;
} else {
  console.log('   ✅ Session secret is customized');
  checks.passed++;
}

// Check 3: Node Environment
console.log('\n3️⃣  Checking Node Environment...');
if (process.env.NODE_ENV === 'production') {
  console.log('   ✅ NODE_ENV: production');
  checks.passed++;
} else {
  console.log(`   ⚠️  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log('   Recommended: Set NODE_ENV=production');
  checks.warnings++;
}

// Check 4: Database Connection
console.log('\n4️⃣  Checking Database Connection...');
try {
  await sequelize.authenticate();
  console.log('   ✅ Database connection successful');
  console.log(`   📊 Database: ${process.env.DB_NAME}`);
  checks.passed++;
} catch (error) {
  console.log('   ❌ Database connection failed');
  console.log(`   Error: ${error.message}`);
  checks.failed++;
}

// Check 5: Database Tables
console.log('\n5️⃣  Checking Database Tables...');
try {
  const [results] = await sequelize.query('SHOW TABLES');
  const tables = results.map(r => Object.values(r)[0]);
  
  const requiredTables = [
    'users',
    'residents',
    'announcements',
    'blotters',
    'indigency_requests',
    'chat_messages'
  ];
  
  requiredTables.forEach(table => {
    if (tables.includes(table)) {
      console.log(`   ✅ Table '${table}' exists`);
      checks.passed++;
    } else {
      console.log(`   ❌ Table '${table}' missing`);
      checks.failed++;
    }
  });
} catch (error) {
  console.log('   ❌ Could not check tables');
  console.log(`   Error: ${error.message}`);
  checks.failed++;
}

// Check 6: Admin User
console.log('\n6️⃣  Checking Admin User...');
try {
  const [results] = await sequelize.query(
    "SELECT username, role, status FROM users WHERE role = 'Admin' LIMIT 1"
  );
  
  if (results.length > 0) {
    console.log(`   ✅ Admin user exists: ${results[0].username}`);
    console.log(`   Status: ${results[0].status}`);
    checks.passed++;
    
    if (results[0].username === 'admin') {
      console.log('   ⚠️  WARNING: Using default admin username');
      console.log('   Consider changing admin password immediately');
      checks.warnings++;
    }
  } else {
    console.log('   ❌ No admin user found');
    console.log('   Run: node setup-mysql.js');
    checks.failed++;
  }
} catch (error) {
  console.log('   ❌ Could not check admin user');
  console.log(`   Error: ${error.message}`);
  checks.failed++;
}

// Check 7: File Permissions
console.log('\n7️⃣  Checking File Permissions...');
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (fs.existsSync(uploadsDir)) {
    // Try to write a test file
    const testFile = path.join(uploadsDir, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('   ✅ Uploads directory is writable');
    checks.passed++;
  } else {
    console.log('   ⚠️  Uploads directory does not exist');
    console.log('   Creating uploads directory...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('   ✅ Uploads directory created');
    checks.warnings++;
  }
} catch (error) {
  console.log('   ❌ Uploads directory is not writable');
  console.log('   Fix: chmod 755 public/uploads');
  checks.failed++;
}

// Check 8: Email Configuration
console.log('\n8️⃣  Checking Email Configuration...');
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  console.log('   ✅ Email credentials configured');
  console.log(`   Email: ${process.env.EMAIL_USER}`);
  checks.passed++;
} else {
  console.log('   ⚠️  Email credentials not configured');
  console.log('   Email notifications will not work');
  checks.warnings++;
}

// Summary
console.log('\n========================================');
console.log('📊 Summary');
console.log('========================================');
console.log(`✅ Passed: ${checks.passed}`);
console.log(`❌ Failed: ${checks.failed}`);
console.log(`⚠️  Warnings: ${checks.warnings}`);
console.log('========================================\n');

if (checks.failed === 0 && checks.warnings === 0) {
  console.log('🎉 All checks passed! Your application is ready for production.\n');
} else if (checks.failed === 0) {
  console.log('✅ All critical checks passed.');
  console.log('⚠️  Please review warnings above.\n');
} else {
  console.log('❌ Some checks failed. Please fix the issues above before deploying.\n');
}

// Close database connection
await sequelize.close();
process.exit(checks.failed > 0 ? 1 : 0);
