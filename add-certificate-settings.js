import { sequelize } from './config/db.js';
import { CertificateSettings, ensureDefaultSettings } from './models/CertificateSettings.js';

async function addCertificateSettings() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🔄 Creating certificate_settings table...');
    await CertificateSettings.sync({ alter: true });
    console.log('✅ certificate_settings table created/updated');

    console.log('🔄 Creating default settings...');
    await ensureDefaultSettings();
    console.log('✅ Default settings created');

    console.log('\n✅ Certificate settings migration complete!');
    console.log('\n📝 You can now customize certificate settings at:');
    console.log('   /certificate-settings (Admin or Secretary role required)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addCertificateSettings();
