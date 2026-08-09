import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Blotter = sequelize.define('Blotter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  complainant_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  complainant_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  complainant_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  respondent_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  respondent_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  respondent_contact: {
    type: DataTypes.STRING,
    allowNull: true
  },
  incident_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  incident_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  incident_time: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  action_taken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Resolved', 'Referred to Police'),
    defaultValue: 'Pending'
  },
  reported_by: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date_filed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'blotters',
  timestamps: true
});

export default Blotter;
