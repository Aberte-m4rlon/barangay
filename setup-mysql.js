import { sequelize } from './config/db.js';
import { User, createAdmin } from './models/userModel.js';
import Resident from './models/Resident.js';
import Announcement from './models/Announcement.js';
import Blotter from './models/Blotter.js';
import IndigencyRequest from './models/IndigencyRequest.js';
import ChatMessage from './models/ChatMessage.js';
import Comment from './models/Comment.js';
import { CertificateSettings, ensureDefaultSettings } from './models/CertificateSettings.js';

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MySQL...');
    await sequelize.authenticate();
    console.log('✅ MySQL Connected');

    console.log('🔄 Creating tables...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ All tables created successfully');

    console.log('🔄 Creating admin user...');
    await createAdmin();

    console.log('🔄 Creating default certificate settings...');
    await ensureDefaultSettings();

    console.log('\n✅ Database setup complete!');
    console.log('\n📊 Tables created:');
    console.log('  - users');
    console.log('  - residents');
    console.log('  - announcements');
    console.log('  - blotters');
    console.log('  - indigency_requests');
    console.log('  - chat_messages');
    console.log('  - comments');
    console.log('  - certificate_settings');
    console.log('\n👤 Default Admin Account:');
    console.log('  Username: admin');
    console.log('  Password: 123456');
    console.log('  Email: admin@barangay.com');
    console.log('\n⚠️  Please change the admin password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
