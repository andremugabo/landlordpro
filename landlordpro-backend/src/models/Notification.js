const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const Notification = sequelize.define('Notification', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
user_id: { type: DataTypes.UUID, allowNull: false },
message: { type: DataTypes.TEXT, allowNull: false },
type: { type: DataTypes.STRING, allowNull: false },
is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
lease_id: { type: DataTypes.UUID, allowNull: true },
payment_id: { type: DataTypes.UUID, allowNull: true },
document_id: { type: DataTypes.UUID, allowNull: true }
}, { tableName: 'notifications', timestamps: false });


module.exports = Notification;