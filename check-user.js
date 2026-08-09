import { User } from './models/userModel.js';
import bcrypt from 'bcryptjs';
import { sequelize } from './config/db.js';

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get all users
    const users = await User.findAll({ raw: true });
    
    console.log('\n📋 All Users in Database:');
    console.log('========================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 Creating default admin user...');
      
      const hashedPass = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@barangay.com',
        password: hashedPass,
        role: 'Admin',
        status: 'approved'
      });
      
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
      });
    }

    // Test password comparison for first user
    if (users.length > 0) {
      console.log('\n🔐 Testing Password Verification:');
      console.log('================================');
      
      const testUser = users[0];
      console.log(`Testing user: ${testUser.username}`);
      
      // Test common passwords
      const testPasswords = ['admin123', '123456', 'password', testUser.username];
      
      for (const testPass of testPasswords) {
        const isMatch = await bcrypt.compare(testPass, testUser.password);
        console.log(`   "${testPass}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
