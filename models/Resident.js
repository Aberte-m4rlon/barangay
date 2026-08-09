// models/Resident.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Resident = sequelize.define('Resident', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  purok: {
    type: DataTypes.STRING,
    allowNull: true
  },
  birthdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile_image: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'residents',
  timestamps: true
});

export default Resident;
