import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const CertificateSettings = sequelize.define('CertificateSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Logo
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  
  // Header Information
  republic: {
    type: DataTypes.STRING,
    defaultValue: 'Republic of the Philippines'
  },
  province: {
    type: DataTypes.STRING,
    defaultValue: 'Province of Oriental Mindoro'
  },
  municipality: {
    type: DataTypes.STRING,
    defaultValue: 'Municipality of Bongabong'
  },
  office_title: {
    type: DataTypes.STRING,
    defaultValue: 'OFFICE OF THE BARANGAY CAPTAIN'
  },
  barangay_name: {
    type: DataTypes.STRING,
    defaultValue: 'Barangay Labasan'
  },
  
  // Certificate Title
  certificate_title: {
    type: DataTypes.STRING,
    defaultValue: 'Certificate of Indigency'
  },
  
  // Signatories
  secretary_name: {
    type: DataTypes.STRING,
    defaultValue: 'Barangay Secretary'
  },
  secretary_title: {
    type: DataTypes.STRING,
    defaultValue: 'Barangay Secretary'
  },
  captain_name: {
    type: DataTypes.STRING,
    defaultValue: 'Barangay Captain'
  },
  captain_title: {
    type: DataTypes.STRING,
    defaultValue: 'Barangay Captain'
  },
  
  // Footer
  validity_text: {
    type: DataTypes.STRING,
    defaultValue: 'This certificate is valid for six (6) months from the date of issue'
  },
  seal_text: {
    type: DataTypes.STRING,
    defaultValue: 'Not valid without official seal'
  },
  
  // Seal
  seal_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  seal_text_line1: {
    type: DataTypes.STRING,
    defaultValue: 'BARANGAY'
  },
  seal_text_line2: {
    type: DataTypes.STRING,
    defaultValue: 'SEAL'
  }
}, {
  tableName: 'certificate_settings',
  timestamps: true
});

// Create default settings if none exist
async function ensureDefaultSettings() {
  try {
    const count = await CertificateSettings.count();
    if (count === 0) {
      await CertificateSettings.create({});
      console.log('✅ Default certificate settings created');
    }
  } catch (error) {
    console.error('❌ Error creating default certificate settings:', error);
  }
}

export { CertificateSettings, ensureDefaultSettings };
