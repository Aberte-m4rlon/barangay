import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profilePhoto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  validIdFront: {
    type: DataTypes.STRING,
    allowNull: true
  },
  validIdBack: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Create admin user function
async function createAdmin() {
  try {
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    const hashedPass = await bcrypt.hash('123456', 10);
    await User.create({
      username: 'admin',
      password: hashedPass,
      email: 'admin@barangay.com',
      role: 'Admin',
      status: 'approved'
    });
    console.log('✅ Secure admin user added!');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

export { User, createAdmin };
