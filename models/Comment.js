import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  announcement_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'announcements',
      key: 'id'
    }
  },
  commenter_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  commenter_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  comment_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export default Comment;
