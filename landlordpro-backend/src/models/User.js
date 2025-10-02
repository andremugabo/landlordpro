const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const User = sequelize.define('User', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
email: { type: DataTypes.STRING, allowNull: false, unique: true },
password_hash: { type: DataTypes.STRING, allowNull: false },
full_name: { type: DataTypes.STRING, allowNull: false },
role: { type: DataTypes.ENUM('admin','manager','user'), defaultValue: 'user' },
is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
tableName: 'users',
timestamps: false
});


module.exports = User;