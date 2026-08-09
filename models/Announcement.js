import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  posted_by: {
    type: DataTypes.STRING,
    allowNull: false
  },
  media: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  date_posted: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  archived_date: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'announcements',
  timestamps: true
});

export default Announcement;
