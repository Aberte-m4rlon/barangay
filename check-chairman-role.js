import { User } from './models/userModel.js';
import { sequelize } from './config/db.js';

async function checkChairmanRole() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find all users with "chairman" in their role (case insensitive)
    const users = await User.findAll({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('role')),
        'LIKE',
        '%chairman%'
      ),
      raw: true
    });

    if (users.length === 0) {
      console.log('❌ No chairman users found\n');
    } else {
      console.log('📋 Chairman Users Found:');
      console.log('='.repeat(60));
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: "${user.role}" (length: ${user.role.length})`);
        console.log(`   Status: ${user.status}`);
        
        // Check for exact match
        if (user.role === "SK Chairman") {
          console.log(`   ✅ Exact match: "SK Chairman"`);
        } else {
          console.log(`   ⚠️  NOT exact match!`);
          console.log(`   Expected: "SK Chairman"`);
          console.log(`   Got: "${user.role}"`);
          console.log(`   Suggestion: Update role to "SK Chairman"`);
        }
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 The role must be exactly "SK Chairman" (with space)');
    console.log('   To fix: UPDATE users SET role = "SK Chairman" WHERE id = X;\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkChairmanRole();
