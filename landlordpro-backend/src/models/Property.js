const { DataTypes } = require('sequelize');
const sequelize = require('../../db');


const Property = sequelize.define('Property', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
name: { type: DataTypes.STRING, allowNull: false },
location: { type: DataTypes.STRING, allowNull: false },
description: { type: DataTypes.TEXT, allowNull: true },
created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'properties', timestamps: false });


module.exports = Property;