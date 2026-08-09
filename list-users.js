import { User } from './models/userModel.js';
import { sequelize } from './config/db.js';

async function listUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
      raw: true
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!\n');
      console.log('💡 Run "node create-captain.js" or register a new user\n');
      process.exit(0);
    }

    console.log('📋 All Users in Database:');
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`Total Users: ${users.length}\n`);

    // Count by status
    const approved = users.filter(u => u.status === 'approved').length;
    const pending = users.filter(u => u.status === 'pending').length;
    const rejected = users.filter(u => u.status === 'rejected').length;

    console.log('📊 Status Summary:');
    console.log(`   Approved: ${approved}`);
    console.log(`   Pending: ${pending}`);
    console.log(`   Rejected: ${rejected}`);

    // Count by role
    console.log('\n📊 Role Summary:');
    const roles = {};
    users.forEach(u => {
      roles[u.role] = (roles[u.role] || 0) + 1;
    });
    Object.entries(roles).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });

    console.log('\n💡 To reset a password, run: node reset-password.js\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listUsers();
