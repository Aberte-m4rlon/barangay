import { User } from './models/userModel.js';
import bcrypt from 'bcryptjs';
import { sequelize } from './config/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get username
    const username = await question('Enter username to reset password: ');
    
    if (!username) {
      console.log('❌ Username is required');
      rl.close();
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    
    if (!user) {
      console.log(`❌ User "${username}" not found`);
      console.log('\n📋 Available users:');
      const allUsers = await User.findAll({ attributes: ['username', 'role', 'status'], raw: true });
      allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.role}) [${u.status}]`);
      });
      rl.close();
      process.exit(1);
    }

    console.log(`\n✅ Found user: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Email: ${user.email}`);

    // Get new password
    const newPassword = await question('\nEnter new password: ');
    
    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters');
      rl.close();
      process.exit(1);
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(
      { 
        password: hashedPassword,
        status: 'approved' // Also ensure user is approved
      },
      { where: { username } }
    );

    console.log('\n✅ Password updated successfully!');
    console.log(`   Username: ${username}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`   Status: approved`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

resetPassword();
