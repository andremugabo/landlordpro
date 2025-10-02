const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  lease_id: { type: DataTypes.UUID, allowNull: true },
  payment_id: { type: DataTypes.UUID, allowNull: true },
  document_id: { type: DataTypes.UUID, allowNull: true }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_read'] }
  ]
});

module.exports = { Notification };
