const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const Tenant = sequelize.define('Tenant', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
name: { type: DataTypes.STRING, allowNull: false },
email: { type: DataTypes.STRING, allowNull: true },
phone: { type: DataTypes.STRING, allowNull: true }
}, { tableName: 'tenants', timestamps: false });


module.exports = Tenant;